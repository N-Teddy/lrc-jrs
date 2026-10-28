import {
  calculateAge,
  ErrorCode,
  type IAuthUser,
  type IUser,
  isJrAgeEligible,
  JR_AGE_RANGE,
  UserRole,
} from '@jrs/shared';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { type Model, Types } from 'mongoose';
import {
  BadRequestAppException,
  ConflictAppException,
  ForbiddenAppException,
  NotFoundAppException,
} from '../../core/exceptions/app.exception';
import { PasswordGeneratorUtil } from '../../core/utils/password-generator.util';
import { PhoneSanitizer } from '../../core/utils/phone-sanitizer.util';
import { UserMapperUtil } from '../../core/utils/user-mapper.util';
import {
  AccountStatus,
  Town,
  type TownDocument,
  User,
  type UserDocument,
} from '../../database/schemas';
import { EmailService } from '../../services/email.service';
import { MediaService } from '../../services/media.service';
import { WhatsAppService } from '../../services/whatsapp.service';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  ChangeTownPcDto,
  CreateMemberDto,
  MemberQueryDto,
  TransferTownDto,
  UpdateAccessDto,
  UpdateMemberDto,
} from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Town.name) private readonly townModel: Model<TownDocument>,
    private readonly emailService: EmailService,
    private readonly whatsAppService: WhatsAppService,
    private readonly mediaService: MediaService,
    private readonly notificationsService: NotificationsService,
  ) {
    void InjectModel;
    void Town;
  }

  /**
   * Helper to resolve town identifier (either ObjectId string or town code like "DLA")
   */
  async resolveTownObjectId(
    identifier?: string,
  ): Promise<Types.ObjectId | null> {
    if (!identifier) return null;
    const trimmed = identifier.trim();

    if (Types.ObjectId.isValid(trimmed) && trimmed.length === 24) {
      return new Types.ObjectId(trimmed);
    }

    const town = await this.townModel
      .findOne({ code: trimmed.toUpperCase() })
      .exec();
    return town ? (town._id as Types.ObjectId) : null;
  }

  /**
   * Helper to map a mongoose user document to a clean IUser object
   */
  private mapUser(doc: UserDocument): IUser {
    return UserMapperUtil.mapUser(doc);
  }

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    const sanitized = PhoneSanitizer.toInternationalDigits(phone);
    return this.userModel.findOne({ phoneNumber: sanitized }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.trim().toLowerCase() }).exec();
  }

  async findByIdentifier(identifier: string): Promise<UserDocument | null> {
    if (!identifier) return null;
    const trimmed = identifier.trim();

    if (trimmed.includes('@')) {
      return this.findByEmail(trimmed);
    }

    return this.findByPhone(trimmed);
  }

  async countActivePcsForTown(
    townId: string | Types.ObjectId,
  ): Promise<number> {
    const objectId =
      typeof townId === 'string' ? new Types.ObjectId(townId) : townId;
    return this.userModel.countDocuments({
      homeTownId: objectId,
      isActivePC: true,
      role: UserRole.PC,
      'account.isAccessRevoked': { $ne: true },
    });
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    const created = new this.userModel(data);
    return created.save();
  }

  async update(
    id: string | Types.ObjectId,
    data: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async findUsersWithoutAvatars(): Promise<UserDocument[]> {
    return this.userModel
      .find({
        $or: [
          { avatarUrl: { $exists: false } },
          { avatarUrl: null },
          { avatarUrl: '' },
          { avatarUrl: { $regex: '/raw/upload/' } },
        ],
      })
      .exec();
  }

  /**
   * Lists members with pagination, filtering, search, and town scoping
   */
  async findAll(
    query: MemberQueryDto,
    scopedTownId?: string,
    currentUser?: IAuthUser,
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    const andConditions: any[] = [];

    // Town resolution:
    // AP can query any town or leave open; PC is scoped to target town
    const requestedTown = query.townId || scopedTownId;
    if (requestedTown && requestedTown !== 'all') {
      const townObjectId = await this.resolveTownObjectId(requestedTown);
      if (townObjectId) {
        filter.homeTownId = townObjectId;
      }
    } else if (currentUser?.role !== UserRole.AP && currentUser?.homeTownId) {
      // Non-AP must always be scoped to their home or active town
      const fallbackTownId = await this.resolveTownObjectId(
        scopedTownId || currentUser.homeTownId,
      );
      if (fallbackTownId) {
        filter.homeTownId = fallbackTownId;
      }
    }

    // Role filter
    if (query.role) {
      filter.role = query.role;
    }

    // Status filter
    if (query.status) {
      filter['account.status'] = query.status;
    }

    // JR age eligibility filter
    if (query.isJr !== undefined) {
      filter.isJr = query.isJr;
    }

    // App access filter
    if (query.hasAppAccess !== undefined) {
      if (query.hasAppAccess) {
        filter['account.hasAppAccess'] = true;
      } else {
        andConditions.push({
          $or: [
            { 'account.hasAppAccess': false },
            { 'account.hasAppAccess': { $exists: false } },
            { account: { $exists: false } },
          ],
        });
      }
    }

    // Search query matching name, phone, or email
    if (query.search?.trim()) {
      const term = query.search.trim();
      const regex = new RegExp(term, 'i');
      const searchCondition = [
        { fullName: regex },
        { phoneNumber: regex },
        { email: regex },
      ];
      andConditions.push({ $or: searchCondition });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const [total, docs] = await Promise.all([
      this.userModel.countDocuments(filter).exec(),
      this.userModel
        .find(filter)
        .populate('homeTownId')
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    const items = docs.map((d) => this.mapUser(d));
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieves summary metrics for a town hub
   */
  async getStats(scopedTownId?: string, currentUser?: IAuthUser) {
    const filter: Record<string, unknown> = {};
    const targetTown = scopedTownId || currentUser?.homeTownId;

    if (targetTown && targetTown !== 'all') {
      const townObjectId = await this.resolveTownObjectId(targetTown);
      if (townObjectId) {
        filter.homeTownId = townObjectId;
      }
    }

    const [
      totalMembers,
      activeJrCount,
      activePcCount,
      appAccessCount,
      pendingActivationCount,
    ] = await Promise.all([
      this.userModel.countDocuments(filter).exec(),
      this.userModel.countDocuments({ ...filter, isJr: true }).exec(),
      this.userModel
        .countDocuments({
          ...filter,
          role: UserRole.PC,
          isActivePC: true,
          'account.isAccessRevoked': { $ne: true },
        })
        .exec(),
      this.userModel
        .countDocuments({ ...filter, 'account.hasAppAccess': true })
        .exec(),
      this.userModel
        .countDocuments({
          ...filter,
          'account.status': AccountStatus.PENDING_ACTIVATION,
        })
        .exec(),
    ]);

    return {
      totalMembers,
      activeJrCount,
      activePcCount,
      appAccessCount,
      pendingActivationCount,
    };
  }

  /**
   * Fetches full profile for a single member
   */
  async findMemberDetail(id: string): Promise<IUser> {
    const user = await this.userModel
      .findById(id)
      .populate('homeTownId')
      .exec();
    if (!user) {
      throw new NotFoundAppException(ErrorCode.MEMBER_NOT_FOUND, { id });
    }
    return this.mapUser(user);
  }

  /**
   * Registers a new member in the community hub
   */
  async createMember(
    dto: CreateMemberDto,
    currentUser: IAuthUser,
    activeTownId?: string,
    file?: Express.Multer.File,
  ): Promise<IUser> {
    // 1. Resolve target town
    const targetTownIdentifier =
      dto.homeTownId || activeTownId || currentUser.homeTownId;
    const townObjectId = await this.resolveTownObjectId(targetTownIdentifier);
    if (!townObjectId) {
      throw new BadRequestAppException(ErrorCode.TOWN_NOT_FOUND);
    }

    // 2. Sanitize and validate phone
    const sanitizedPhone = PhoneSanitizer.toInternationalDigits(
      dto.phoneNumber,
    );
    if (!sanitizedPhone) {
      throw new BadRequestAppException(ErrorCode.BAD_REQUEST);
    }

    const existingPhone = await this.userModel
      .findOne({ phoneNumber: sanitizedPhone })
      .exec();
    if (existingPhone) {
      throw new ConflictAppException(ErrorCode.MEMBER_ALREADY_EXISTS);
    }

    // 3. Email uniqueness if provided
    const normalizedEmail = dto.email?.trim().toLowerCase();
    if (normalizedEmail) {
      const existingEmail = await this.userModel
        .findOne({ email: normalizedEmail })
        .exec();
      if (existingEmail) {
        throw new ConflictAppException(ErrorCode.MEMBER_ALREADY_EXISTS);
      }
    }

    // 4. Validate JR age eligibility
    const isJr = isJrAgeEligible(dto.dateOfBirth);
    const assignedRole = dto.role || UserRole.MEMBER;

    if (assignedRole === UserRole.MEMBER || assignedRole === UserRole.PC) {
      if (!isJr) {
        throw new BadRequestAppException(ErrorCode.MEMBER_AGE_INELIGIBLE, {
          min: JR_AGE_RANGE.MIN,
          max: JR_AGE_RANGE.MAX,
        });
      }
    } else if (assignedRole === UserRole.AP) {
      const age = calculateAge(dto.dateOfBirth);
      if (age <= JR_AGE_RANGE.MAX) {
        throw new BadRequestAppException(ErrorCode.MEMBER_AGE_INELIGIBLE);
      }
    }

    // 5. Enforce max 2 PCs quota if assigning PC role
    const isPC = assignedRole === UserRole.PC;
    if (isPC) {
      const currentActivePcs = await this.countActivePcsForTown(townObjectId);
      if (currentActivePcs >= 2) {
        throw new BadRequestAppException(ErrorCode.BAD_REQUEST);
      }
    }

    // 6. Generate temporary credentials if app access requested
    const hasAppAccess = dto.hasAppAccess !== false;
    let passwordHash: string | undefined;
    let tempPasswordHash: string | undefined;
    let tempPasswordExpiresAt: Date | undefined;
    let isTemporaryPassword = false;
    let generatedTempPassword: string | undefined;

    if (hasAppAccess) {
      generatedTempPassword = PasswordGeneratorUtil.generateTemporaryPassword();
      passwordHash = await bcrypt.hash(generatedTempPassword, 10);
      tempPasswordHash = passwordHash;
      tempPasswordExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h validity
      isTemporaryPassword = true;
    }

    // Check WhatsApp existence
    const isWhatsappVerified =
      await this.whatsAppService.checkContact(sanitizedPhone);

    // 6.5 Resolve avatar: uploaded file or generated DiceBear avatar based on gender
    let avatarUrl = dto.avatarUrl;
    if (file) {
      avatarUrl = await this.mediaService.uploadAvatar(file);
    } else if (!avatarUrl) {
      avatarUrl = await this.mediaService.generateAndSaveDefaultAvatar(
        dto.fullName.trim(),
        sanitizedPhone,
        dto.gender,
      );
    }

    const createdUser = new this.userModel({
      fullName: dto.fullName.trim(),
      phoneNumber: sanitizedPhone,
      email: normalizedEmail || undefined,
      avatarUrl,
      passwordHash,
      tempPasswordHash,
      tempPasswordExpiresAt,
      isTemporaryPassword,
      dateOfBirth: dto.dateOfBirth,
      isJr,
      role: assignedRole,
      isActivePC: isPC,
      homeTownId: townObjectId,
      gender: dto.gender,
      integrationDate: dto.integrationDate,
      isWhatsappVerified,
      account: {
        status: hasAppAccess
          ? AccountStatus.MUST_CHANGE_PASSWORD
          : AccountStatus.PENDING_ACTIVATION,
        hasAppAccess,
        isAccessRevoked: false,
        allowedReadTownIds: [townObjectId.toString()],
        invitedBy: currentUser.id,
        invitedAt: new Date(),
      },
    });

    const savedUser = await createdUser.save();

    // 7. Update town activePcCount if user is a PC
    if (isPC) {
      const newPcCount = await this.countActivePcsForTown(townObjectId);
      await this.townModel
        .findByIdAndUpdate(townObjectId, { activePcCount: newPcCount })
        .exec();
    }

    // 8. Fire-and-forget delivery of credentials
    if (hasAppAccess && generatedTempPassword) {
      this.dispatchCredentials(
        savedUser.fullName,
        sanitizedPhone,
        normalizedEmail,
        generatedTempPassword,
      );
    }

    const populated = await savedUser.populate('homeTownId');
    const townName = (populated.homeTownId as any)?.name || 'Town';

    this.notificationsService
      .createNotification(
        {
          target: {
            townId: townObjectId.toString(),
            roles: [UserRole.AP, UserRole.PC],
            excludeUserIds: [currentUser.id],
          },
          level: 'INFO',
          action: 'MEMBER_REGISTERED',
          titleKey: 'notifications:memberRegisteredTitle',
          bodyKey: 'notifications:memberRegisteredBody',
          bodyParams: {
            name: savedUser.fullName,
            town: townName,
          },
          resource: {
            entityType: 'MEMBER',
            entityId: savedUser._id.toString(),
            townId: townObjectId.toString(),
            subTab: 'directory',
          },
          sendPush: true,
        },
        currentUser.id,
      )
      .catch((err) =>
        this.logger.warn(
          `Failed to dispatch member registered notification: ${err.message}`,
        ),
      );

    return this.mapUser(populated);
  }

  /**
   * Updates an existing member's information
   */
  async updateMember(
    id: string,
    dto: UpdateMemberDto,
    currentUser: IAuthUser,
    file?: Express.Multer.File,
  ): Promise<IUser> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundAppException(ErrorCode.MEMBER_NOT_FOUND, { id });
    }

    // Check phone uniqueness if modified
    if (dto.phoneNumber) {
      const sanitized = PhoneSanitizer.toInternationalDigits(dto.phoneNumber);
      if (sanitized && sanitized !== user.phoneNumber) {
        const conflict = await this.userModel
          .findOne({ phoneNumber: sanitized })
          .exec();
        if (conflict) {
          throw new ConflictAppException(ErrorCode.MEMBER_ALREADY_EXISTS);
        }
        user.phoneNumber = sanitized;
      }
    }

    // Check email uniqueness if modified
    if (dto.email !== undefined) {
      const normEmail = dto.email ? dto.email.trim().toLowerCase() : undefined;
      if (normEmail && normEmail !== user.email) {
        const conflict = await this.userModel
          .findOne({ email: normEmail })
          .exec();
        if (conflict) {
          throw new ConflictAppException(ErrorCode.MEMBER_ALREADY_EXISTS);
        }
      }
      user.email = normEmail || undefined;
    }

    if (dto.fullName) {
      user.fullName = dto.fullName.trim();
    }

    // Re-validate age if dateOfBirth changed
    if (dto.dateOfBirth) {
      const _age = calculateAge(dto.dateOfBirth);
      const isJr = isJrAgeEligible(dto.dateOfBirth);
      const roleToCheck = dto.role || user.role;

      if (roleToCheck === UserRole.MEMBER || roleToCheck === UserRole.PC) {
        if (!isJr) {
          throw new BadRequestAppException(ErrorCode.MEMBER_AGE_INELIGIBLE, {
            min: JR_AGE_RANGE.MIN,
            max: JR_AGE_RANGE.MAX,
          });
        }
      }
      user.dateOfBirth = dto.dateOfBirth;
      user.isJr = isJr;
    }

    // Handle role or PC status change
    if (dto.role) {
      user.role = dto.role;
    }

    if (dto.isActivePC !== undefined) {
      if (dto.isActivePC && !user.isActivePC) {
        // Enforce quota
        const currentPcs = await this.countActivePcsForTown(user.homeTownId);
        if (currentPcs >= 2) {
          throw new BadRequestAppException(ErrorCode.BAD_REQUEST);
        }
      }
      user.isActivePC = dto.isActivePC;
    }

    if (dto.hasAppAccess !== undefined) {
      user.account.hasAppAccess = dto.hasAppAccess;
    }

    if (dto.gender !== undefined) {
      user.gender = dto.gender;
    }

    if (dto.integrationDate !== undefined) {
      user.integrationDate = dto.integrationDate;
    }

    // Handle avatar image update or regeneration if gender changed
    if (file) {
      user.avatarUrl = await this.mediaService.uploadAvatar(file);
    } else if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl;
    } else if (dto.gender !== undefined) {
      // If gender was updated and user has an auto-generated SVG avatar (or no avatar), update it to match new gender
      if (!user.avatarUrl || user.avatarUrl.includes('/uploads/avatars/')) {
        const identifier = user.phoneNumber || user._id.toString();
        user.avatarUrl = await this.mediaService.generateAndSaveDefaultAvatar(
          user.fullName,
          identifier,
          dto.gender,
        );
      }
    }

    const saved = await user.save();

    // Recalculate town PC count
    if (user.homeTownId) {
      const pcCount = await this.countActivePcsForTown(user.homeTownId);
      await this.townModel
        .findByIdAndUpdate(user.homeTownId, { activePcCount: pcCount })
        .exec();
    }

    const populated = await saved.populate('homeTownId');

    // Notify member (if edited by leader) and notify Town PC
    const isSensitiveChange =
      dto.phoneNumber !== undefined ||
      dto.email !== undefined ||
      dto.role !== undefined ||
      dto.isActivePC !== undefined ||
      dto.hasAppAccess !== undefined;
    const isEditedByLeader = currentUser.id !== user._id.toString();

    if (isSensitiveChange || isEditedByLeader) {
      const townIdStr = user.homeTownId?.toString();
      this.notificationsService
        .createNotification(
          {
            target: {
              userIds: [user._id.toString()],
              roles: [UserRole.AP, UserRole.PC],
              townId: townIdStr,
              excludeUserIds: [currentUser.id],
            },
            level: 'INFO',
            action: 'MEMBER_UPDATED',
            titleKey: 'notifications:memberUpdatedTitle',
            bodyKey: 'notifications:memberUpdatedBody',
            bodyParams: {
              name: user.fullName,
              by: currentUser.fullName,
            },
            resource: {
              entityType: 'MEMBER',
              entityId: user._id.toString(),
              townId: townIdStr,
              subTab: 'directory',
            },
            sendPush: true,
          },
          currentUser.id,
        )
        .catch((err) =>
          this.logger.warn(
            `Failed to dispatch member updated notification: ${err.message}`,
          ),
        );
    }

    return this.mapUser(populated);
  }

  /**
   * Updates app access, revocation status, or resends temporary credentials
   */
  async updateAccess(
    id: string,
    dto: UpdateAccessDto,
    _currentUser: IAuthUser,
  ): Promise<IUser> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundAppException(ErrorCode.MEMBER_NOT_FOUND, { id });
    }

    let accessGranted = false;
    let accessRevoked = false;

    if (dto.hasAppAccess !== undefined) {
      const wasAppAccess = user.account.hasAppAccess;
      user.account.hasAppAccess = dto.hasAppAccess;

      if (dto.hasAppAccess && !wasAppAccess) {
        accessGranted = true;
        // Invite to app
        const tempPassword = PasswordGeneratorUtil.generateTemporaryPassword();
        const hash = await bcrypt.hash(tempPassword, 10);
        user.passwordHash = hash;
        user.tempPasswordHash = hash;
        user.tempPasswordExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
        user.isTemporaryPassword = true;
        user.account.isAccessRevoked = false;
        user.account.status = AccountStatus.MUST_CHANGE_PASSWORD;

        this.dispatchCredentials(
          user.fullName,
          user.phoneNumber,
          user.email,
          tempPassword,
        );
      }
    }

    if (dto.isAccessRevoked !== undefined) {
      user.account.isAccessRevoked = dto.isAccessRevoked;
      if (dto.isAccessRevoked) {
        accessRevoked = true;
        user.account.status = AccountStatus.REVOKED;
      } else if (user.account.status === AccountStatus.REVOKED) {
        user.account.status = AccountStatus.ACTIVE;
      }
    }

    // Resend invite / generate fresh temporary password
    if (dto.resendInvite) {
      if (!user.isTemporaryPassword) {
        throw new BadRequestAppException(ErrorCode.BAD_REQUEST);
      }
      const tempPassword = PasswordGeneratorUtil.generateTemporaryPassword();
      const hash = await bcrypt.hash(tempPassword, 10);
      user.passwordHash = hash;
      user.tempPasswordHash = hash;
      user.tempPasswordExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      user.isTemporaryPassword = true;
      user.account.hasAppAccess = true;
      user.account.isAccessRevoked = false;
      user.account.status = AccountStatus.MUST_CHANGE_PASSWORD;

      this.dispatchCredentials(
        user.fullName,
        user.phoneNumber,
        user.email,
        tempPassword,
      );
    }

    if (dto.allowedReadTownIds !== undefined) {
      user.account.allowedReadTownIds = dto.allowedReadTownIds;
    }

    const saved = await user.save();
    const populated = await saved.populate('homeTownId');

    if (accessGranted) {
      this.notificationsService
        .createNotification(
          {
            target: {
              userIds: [user._id.toString()],
            },
            level: 'SUCCESS',
            action: 'ACCESS_GRANTED',
            titleKey: 'notifications:accessGrantedTitle',
            bodyKey: 'notifications:accessGrantedBody',
            resource: {
              entityType: 'ACCESS',
              entityId: user._id.toString(),
              townId: user.homeTownId?.toString(),
              subTab: 'access',
            },
            sendPush: true,
          },
          _currentUser.id,
        )
        .catch((err) =>
          this.logger.warn(
            `Failed to dispatch access granted notification: ${err.message}`,
          ),
        );
    } else if (accessRevoked) {
      this.notificationsService
        .createNotification(
          {
            target: {
              userIds: [user._id.toString()],
            },
            level: 'ERROR',
            action: 'ACCESS_REVOKED',
            titleKey: 'notifications:accessRevokedTitle',
            bodyKey: 'notifications:accessRevokedBody',
            resource: {
              entityType: 'ACCESS',
              entityId: user._id.toString(),
              townId: user.homeTownId?.toString(),
              subTab: 'access',
            },
            sendPush: true,
          },
          _currentUser.id,
        )
        .catch((err) =>
          this.logger.warn(
            `Failed to dispatch access revoked notification: ${err.message}`,
          ),
        );
    } else if (dto.allowedReadTownIds !== undefined) {
      this.notificationsService
        .createNotification(
          {
            target: {
              userIds: [user._id.toString()],
            },
            level: 'INFO',
            action: 'TOWN_SCOPE_UPDATED',
            titleKey: 'notifications:townScopeUpdatedTitle',
            bodyKey: 'notifications:townScopeUpdatedBody',
            resource: {
              entityType: 'ACCESS',
              entityId: user._id.toString(),
              townId: user.homeTownId?.toString(),
              subTab: 'access',
            },
            sendPush: true,
          },
          _currentUser.id,
        )
        .catch((err) =>
          this.logger.warn(
            `Failed to dispatch town scope updated notification: ${err.message}`,
          ),
        );
    }

    return this.mapUser(populated);
  }

  /**
   * Deactivates or removes a member (AP only)
   */
  async deleteMember(id: string, currentUser: IAuthUser): Promise<void> {
    if (currentUser.role !== UserRole.AP) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
    }

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundAppException(ErrorCode.MEMBER_NOT_FOUND, { id });
    }

    const townId = user.homeTownId;
    const populated = await user.populate('homeTownId');
    const townName = (populated.homeTownId as any)?.name || 'Town';
    const townIdStr = townId?.toString();

    await this.userModel.findByIdAndDelete(id).exec();

    if (townId) {
      const pcCount = await this.countActivePcsForTown(townId);
      await this.townModel
        .findByIdAndUpdate(townId, { activePcCount: pcCount })
        .exec();
    }

    this.notificationsService
      .createNotification(
        {
          target: {
            townId: townIdStr,
            roles: [UserRole.AP, UserRole.PC],
            excludeUserIds: [currentUser.id],
          },
          level: 'WARNING',
          action: 'MEMBER_DELETED',
          titleKey: 'notifications:memberDeletedTitle',
          bodyKey: 'notifications:memberDeletedBody',
          bodyParams: {
            name: user.fullName,
            town: townName,
            by: currentUser.fullName,
          },
          resource: {
            entityType: 'MEMBER',
            entityId: id,
            townId: townIdStr,
            subTab: 'directory',
          },
          sendPush: true,
        },
        currentUser.id,
      )
      .catch((err) =>
        this.logger.warn(
          `Failed to dispatch member deleted notification: ${err.message}`,
        ),
      );
  }

  async deleteAll(): Promise<void> {
    await this.userModel.deleteMany({}).exec();
  }

  /**
   * Transfer a member to a new town hub with full audit trail
   */
  async transferMember(
    userId: string,
    dto: TransferTownDto,
    currentUser: IAuthUser,
  ): Promise<IUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestAppException(ErrorCode.MEMBER_INVALID_ID);
    }
    if (!Types.ObjectId.isValid(dto.toTownId)) {
      throw new BadRequestAppException(ErrorCode.TOWN_INVALID_ID);
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundAppException(ErrorCode.MEMBER_NOT_FOUND, {
        id: userId,
      });
    }

    const currentTownIdStr = user.homeTownId?.toString();
    const destTownIdStr = dto.toTownId.toString();

    if (currentTownIdStr === destTownIdStr) {
      throw new BadRequestAppException(ErrorCode.BAD_REQUEST);
    }

    const destTown = await this.townModel.findById(dto.toTownId).exec();
    if (!destTown) {
      throw new NotFoundAppException(ErrorCode.TOWN_NOT_FOUND);
    }

    // Role check: AP can transfer anyone; PC can only transfer members out of their assigned hub
    const isAP = currentUser.role === UserRole.AP;
    const isPC = currentUser.role === UserRole.PC;
    if (!isAP && !isPC) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
    }

    if (isPC && !isAP && currentTownIdStr !== currentUser.homeTownId) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
    }

    // Build transfer record
    const transferRecord = {
      fromTownId: currentTownIdStr,
      toTownId: destTownIdStr,
      transferredAt: new Date().toISOString(),
      transferredBy: currentUser.fullName || currentUser.id,
      reason: dto.reason?.trim() || undefined,
    };

    if (!user.transferHistory) {
      user.transferHistory = [];
    }
    user.transferHistory.push(transferRecord as any);

    // Update member's home town
    user.homeTownId = new Types.ObjectId(destTownIdStr) as any;

    // If member was PC in old town, reset PC status in new town to avoid exceeding quota
    if (user.isActivePC) {
      user.isActivePC = false;
      if (user.role === UserRole.PC) {
        user.role = UserRole.MEMBER;
      }
    }

    await user.save();

    const fromTown = currentTownIdStr
      ? await this.townModel.findById(currentTownIdStr).exec()
      : null;
    const fromTownName = fromTown?.name || 'Former Town';
    const toTownName = destTown.name;

    this.notificationsService
      .createNotification(
        {
          target: {
            userIds: [user._id.toString()],
            roles: [UserRole.AP, UserRole.PC],
            townId: destTownIdStr,
            excludeUserIds: [currentUser.id],
          },
          level: 'INFO',
          action: 'TOWN_TRANSFER',
          titleKey: 'notifications:townTransferTitle',
          bodyKey: 'notifications:townTransferBody',
          bodyParams: {
            name: user.fullName,
            fromTown: fromTownName,
            toTown: toTownName,
          },
          resource: {
            entityType: 'TOWN_TRANSFER',
            entityId: user._id.toString(),
            townId: destTownIdStr,
            subTab: 'directory',
          },
          sendPush: true,
        },
        currentUser.id,
      )
      .catch((err) =>
        this.logger.warn(
          `Failed to dispatch town transfer notification: ${err.message}`,
        ),
      );

    user.homeTownId = destTown as any;
    return this.mapUser(user);
  }

  /**
   * Helper to dispatch initial or reset credentials via WhatsApp & Email
   */
  private dispatchCredentials(
    name: string,
    phone: string,
    email?: string,
    tempPassword?: string,
  ) {
    if (!tempPassword) return;

    // Send WhatsApp (non-blocking)
    this.whatsAppService
      .sendTemporaryPasswordMessage(phone, {
        fullName: name,
        tempPassword,
        expiresInHours: 48,
      })
      .catch((err) =>
        this.logger.warn(`Failed sending WhatsApp invite: ${err.message}`),
      );

    // Send Email if address exists (non-blocking)
    if (email) {
      this.emailService
        .sendTemporaryPasswordEmail(email, {
          fullName: name,
          tempPassword,
          expiresInHours: 48,
        })
        .catch((err) =>
          this.logger.warn(`Failed sending Email invite: ${err.message}`),
        );
    }
  }

  /**
   * Transitions PC (Program Coordinator) leadership in a town.
   * Can replace an outgoing PC by either:
   * 1. Demoting them to a regular member (keeping member app access)
   * 2. Revoking their account access completely
   */
  async changeTownPc(
    dto: ChangeTownPcDto,
    currentUser: IAuthUser,
  ): Promise<{
    message: string;
    newPc: UserDocument;
    outgoingPc?: UserDocument;
  }> {
    // 1. Authorization: Only AP or the active PC of that town can transition leadership
    const isAP = currentUser.role === UserRole.AP;
    const isCurrentTownPC =
      currentUser.role === UserRole.PC &&
      currentUser.homeTownId?.toString() === dto.townId;

    if (!isAP && !isCurrentTownPC) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
    }

    const townObjectId = new Types.ObjectId(dto.townId);

    // 2. Fetch new PC candidate
    const newPc = await this.userModel.findById(dto.newPcUserId).exec();
    if (!newPc) {
      throw new NotFoundAppException(ErrorCode.MEMBER_NOT_FOUND);
    }

    // Validate age eligibility for PC (18-30)
    const _isJrNew = isJrAgeEligible(newPc.dateOfBirth);
    const _ageNew = calculateAge(newPc.dateOfBirth);
    if (!_isJrNew) {
      throw new BadRequestAppException(ErrorCode.MEMBER_AGE_INELIGIBLE, {
        min: JR_AGE_RANGE.MIN,
        max: JR_AGE_RANGE.MAX,
      });
    }

    let outgoingPc: UserDocument | null = null;

    // 3. Handle outgoing PC if specified
    if (dto.outgoingPcUserId) {
      if (dto.outgoingPcUserId === dto.newPcUserId) {
        throw new BadRequestAppException(ErrorCode.BAD_REQUEST);
      }

      outgoingPc = await this.userModel.findById(dto.outgoingPcUserId).exec();

      if (!outgoingPc) {
        throw new NotFoundAppException(ErrorCode.MEMBER_NOT_FOUND);
      }

      // Step down from PC role
      outgoingPc.role = UserRole.MEMBER;
      outgoingPc.isActivePC = false;

      if (dto.outgoingPcDisposition === 'revoke_access') {
        outgoingPc.account.isAccessRevoked = true;
        outgoingPc.account.hasAppAccess = false;
        outgoingPc.lastLogoutAt = new Date();
      } else {
        // Demote to regular member with app access intact
        outgoingPc.account.isAccessRevoked = false;
        outgoingPc.account.hasAppAccess = true;
      }

      await outgoingPc.save();
    }

    // 4. Verify PC quota for this town (max 2 active PCs)
    const activePcs = await this.countActivePcsForTown(townObjectId);
    if (activePcs >= 2) {
      throw new BadRequestAppException(ErrorCode.BAD_REQUEST);
    }

    // 5. Promote new PC
    newPc.role = UserRole.PC;
    newPc.isActivePC = true;
    newPc.homeTownId = townObjectId;

    // Ensure new PC has app access enabled
    let generatedPassword: string | undefined;
    if (!newPc.account?.hasAppAccess || newPc.account?.isAccessRevoked) {
      newPc.account.hasAppAccess = true;
      newPc.account.isAccessRevoked = false;
      generatedPassword = PasswordGeneratorUtil.generateTemporaryPassword();
      newPc.passwordHash = await bcrypt.hash(generatedPassword, 10);
      newPc.tempPasswordHash = newPc.passwordHash;
      newPc.tempPasswordExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      newPc.isTemporaryPassword = true;
    }

    await newPc.save();

    if (generatedPassword) {
      this.dispatchCredentials(
        newPc.fullName,
        newPc.phoneNumber,
        newPc.email,
        generatedPassword,
      );
    }

    // Notify newly appointed PC
    this.notificationsService
      .createNotification(
        {
          target: {
            userIds: [newPc._id.toString()],
          },
          level: 'SUCCESS',
          action: 'ROLE_CHANGED',
          titleKey: 'notifications:roleChangedTitle',
          bodyKey: 'notifications:roleChangedBody',
          bodyParams: {
            role: 'PC',
          },
          resource: {
            entityType: 'MEMBER',
            entityId: newPc._id.toString(),
            townId: dto.townId,
            subTab: 'access',
          },
          sendPush: true,
        },
        currentUser.id,
      )
      .catch((err) =>
        this.logger.warn(
          `Failed to dispatch new PC role notification: ${err.message}`,
        ),
      );

    // Notify outgoing PC if applicable
    if (outgoingPc) {
      const isRevoked = dto.outgoingPcDisposition === 'revoke_access';
      this.notificationsService
        .createNotification(
          {
            target: {
              userIds: [outgoingPc._id.toString()],
            },
            level: isRevoked ? 'ERROR' : 'WARNING',
            action: isRevoked ? 'ACCESS_REVOKED' : 'ROLE_CHANGED',
            titleKey: isRevoked
              ? 'notifications:accessRevokedTitle'
              : 'notifications:roleChangedTitle',
            bodyKey: isRevoked
              ? 'notifications:accessRevokedBody'
              : 'notifications:roleChangedBody',
            bodyParams: isRevoked ? {} : { role: 'MEMBER' },
            resource: {
              entityType: 'MEMBER',
              entityId: outgoingPc._id.toString(),
              townId: dto.townId,
              subTab: 'access',
            },
            sendPush: true,
          },
          currentUser.id,
        )
        .catch((err) =>
          this.logger.warn(
            `Failed to dispatch outgoing PC notification: ${err.message}`,
          ),
        );
    }

    // Broadcast announcement to all fellowship members of the town
    const town = await this.townModel.findById(townObjectId).exec();
    const townName = town?.name || 'Town';
    this.notificationsService
      .createNotification(
        {
          target: {
            townId: dto.townId,
            excludeUserIds: [
              currentUser.id,
              newPc._id.toString(),
              ...(outgoingPc ? [outgoingPc._id.toString()] : []),
            ],
          },
          level: 'INFO',
          action: 'ROLE_CHANGED',
          titleKey: 'notifications:newTownPcAnnouncedTitle',
          bodyKey: 'notifications:newTownPcAnnouncedBody',
          bodyParams: {
            name: newPc.fullName,
            town: townName,
          },
          resource: {
            entityType: 'MEMBER',
            entityId: newPc._id.toString(),
            townId: dto.townId,
            subTab: 'directory',
          },
          sendPush: true,
        },
        currentUser.id,
      )
      .catch((err) =>
        this.logger.warn(
          `Failed to dispatch town PC announcement notification: ${err.message}`,
        ),
      );

    return {
      message: outgoingPc
        ? `PC leadership transferred from ${outgoingPc.fullName} to ${newPc.fullName} successfully.`
        : `${newPc.fullName} has been appointed as PC successfully.`,
      newPc,
      outgoingPc: outgoingPc || undefined,
    };
  }

  async updateLanguagePreference(
    userId: string,
    language: 'fr' | 'en',
  ): Promise<{ preferredLanguage: 'fr' | 'en' }> {
    if (!['fr', 'en'].includes(language)) {
      throw new BadRequestAppException(ErrorCode.BAD_REQUEST, {
        message: 'Invalid language. Allowed values are "fr" and "en".',
      });
    }
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { preferredLanguage: language } },
      { new: true },
    );
    if (!user) {
      throw new NotFoundAppException(ErrorCode.MEMBER_NOT_FOUND, {
        id: userId,
      });
    }
    return { preferredLanguage: user.preferredLanguage };
  }
}
