import {
  calculateAge,
  type IAuthUser,
  type IUser,
  isJrAgeEligible,
  JR_AGE_RANGE,
  UserRole,
} from '@jrs/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { type Model, Types } from 'mongoose';
import { PasswordGeneratorUtil } from '../../core/utils/password-generator.util';
import { PhoneSanitizer } from '../../core/utils/phone-sanitizer.util';
import {
  AccountStatus,
  Town,
  type TownDocument,
  User,
  type UserDocument,
} from '../../database/schemas';
import { EmailService } from '../../services/email.service';
import { WhatsAppService } from '../../services/whatsapp.service';
import type {
  CreateMemberDto,
  MemberQueryDto,
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
  ) {}

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
    const rawTown = doc.homeTownId as unknown;
    const hasPopulatedTown =
      rawTown &&
      typeof rawTown === 'object' &&
      'name' in (rawTown as Record<string, unknown>);

    const townObj = hasPopulatedTown
      ? (rawTown as { _id: Types.ObjectId; name: string; code: string })
      : undefined;

    return {
      id: doc._id.toString(),
      fullName: doc.fullName,
      phoneNumber: doc.phoneNumber,
      email: doc.email,
      dateOfBirth: doc.dateOfBirth,
      isJr: doc.isJr,
      homeTownId: townObj
        ? townObj._id.toString()
        : doc.homeTownId?.toString() || '',
      homeTown: townObj
        ? {
            id: townObj._id.toString(),
            name: townObj.name,
            code: townObj.code,
            activePcCount: 0,
          }
        : undefined,
      role: doc.role,
      isActivePC: doc.isActivePC || false,
      account: {
        hasAppAccess: doc.account?.hasAppAccess ?? true,
        isAccessRevoked: doc.account?.isAccessRevoked ?? false,
        allowedReadTownIds: doc.account?.allowedReadTownIds || [],
        invitedBy: doc.account?.invitedBy,
        invitedAt: doc.account?.invitedAt
          ? doc.account.invitedAt.toISOString()
          : undefined,
      },
      transferHistory: (doc.transferHistory || []).map((t) => ({
        fromTownId: t.fromTownId,
        toTownId: t.toTownId,
        transferredAt: t.transferredAt,
        transferredBy: t.transferredBy,
        reason: t.reason,
      })),
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };
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

    const filter: Record<string, unknown> = {};

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

    // Search query matching name, phone, or email
    if (query.search?.trim()) {
      const term = query.search.trim();
      const regex = new RegExp(term, 'i');
      filter.$or = [
        { fullName: regex },
        { phoneNumber: regex },
        { email: regex },
      ];
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
      throw new NotFoundException(`Member with ID "${id}" was not found.`);
    }
    return this.mapUser(user);
  }

  /**
   * Registers a new member in the fellowship hub
   */
  async createMember(
    dto: CreateMemberDto,
    currentUser: IAuthUser,
    activeTownId?: string,
  ): Promise<IUser> {
    // 1. Resolve target town
    const targetTownIdentifier =
      dto.homeTownId || activeTownId || currentUser.homeTownId;
    const townObjectId = await this.resolveTownObjectId(targetTownIdentifier);
    if (!townObjectId) {
      throw new BadRequestException(
        'A valid fellowship home town is required.',
      );
    }

    // 2. Sanitize and validate phone
    const sanitizedPhone = PhoneSanitizer.toInternationalDigits(
      dto.phoneNumber,
    );
    if (!sanitizedPhone) {
      throw new BadRequestException(
        'Invalid telephone format. Please use a valid Cameroon phone number.',
      );
    }

    const existingPhone = await this.userModel
      .findOne({ phoneNumber: sanitizedPhone })
      .exec();
    if (existingPhone) {
      throw new ConflictException(
        'A member with this phone number is already registered.',
      );
    }

    // 3. Email uniqueness if provided
    const normalizedEmail = dto.email?.trim().toLowerCase();
    if (normalizedEmail) {
      const existingEmail = await this.userModel
        .findOne({ email: normalizedEmail })
        .exec();
      if (existingEmail) {
        throw new ConflictException(
          'A member with this email address is already registered.',
        );
      }
    }

    // 4. Validate JR age eligibility
    const age = calculateAge(dto.dateOfBirth);
    const isJr = isJrAgeEligible(dto.dateOfBirth);
    const assignedRole = dto.role || UserRole.MEMBER;

    if (assignedRole === UserRole.MEMBER || assignedRole === UserRole.PC) {
      if (!isJr) {
        throw new BadRequestException(
          `Members and Contact Persons (PCs) must be aged between ${JR_AGE_RANGE.MIN} and ${JR_AGE_RANGE.MAX} years old (computed age: ${age}).`,
        );
      }
    } else if (assignedRole === UserRole.AP) {
      if (age <= JR_AGE_RANGE.MAX) {
        throw new BadRequestException(
          'Animateurs Principaux (AP / Overseers) must be older than 30 years old.',
        );
      }
    }

    // 5. Enforce max 2 PCs quota if assigning PC role
    const isPC = assignedRole === UserRole.PC;
    if (isPC) {
      const currentActivePcs = await this.countActivePcsForTown(townObjectId);
      if (currentActivePcs >= 2) {
        throw new BadRequestException(
          'This town already has the maximum of 2 active Contact Persons (PCs).',
        );
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

    const createdUser = new this.userModel({
      fullName: dto.fullName.trim(),
      phoneNumber: sanitizedPhone,
      email: normalizedEmail || undefined,
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
    return this.mapUser(populated);
  }

  /**
   * Updates an existing member's information
   */
  async updateMember(
    id: string,
    dto: UpdateMemberDto,
    _currentUser: IAuthUser,
  ): Promise<IUser> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Member with ID "${id}" was not found.`);
    }

    // Check phone uniqueness if modified
    if (dto.phoneNumber) {
      const sanitized = PhoneSanitizer.toInternationalDigits(dto.phoneNumber);
      if (sanitized && sanitized !== user.phoneNumber) {
        const conflict = await this.userModel
          .findOne({ phoneNumber: sanitized })
          .exec();
        if (conflict) {
          throw new ConflictException(
            'A member with this phone number is already registered.',
          );
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
          throw new ConflictException(
            'A member with this email address is already registered.',
          );
        }
      }
      user.email = normEmail || undefined;
    }

    if (dto.fullName) {
      user.fullName = dto.fullName.trim();
    }

    // Re-validate age if dateOfBirth changed
    if (dto.dateOfBirth) {
      const isJr = isJrAgeEligible(dto.dateOfBirth);
      const roleToCheck = dto.role || user.role;
      const age = calculateAge(dto.dateOfBirth);

      if (roleToCheck === UserRole.MEMBER || roleToCheck === UserRole.PC) {
        if (!isJr) {
          throw new BadRequestException(
            `Members and Contact Persons must be aged between 18 and 30 years old (computed age: ${age}).`,
          );
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
          throw new BadRequestException(
            'This town already has the maximum of 2 active Contact Persons (PCs).',
          );
        }
      }
      user.isActivePC = dto.isActivePC;
    }

    if (dto.hasAppAccess !== undefined) {
      user.account.hasAppAccess = dto.hasAppAccess;
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
      throw new NotFoundException(`Member with ID "${id}" was not found.`);
    }

    if (dto.hasAppAccess !== undefined) {
      const wasAppAccess = user.account.hasAppAccess;
      user.account.hasAppAccess = dto.hasAppAccess;

      if (dto.hasAppAccess && !wasAppAccess) {
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
        user.account.status = AccountStatus.REVOKED;
      } else if (user.account.status === AccountStatus.REVOKED) {
        user.account.status = AccountStatus.ACTIVE;
      }
    }

    // Resend invite / generate fresh temporary password
    if (dto.resendInvite) {
      if (!user.isTemporaryPassword) {
        throw new BadRequestException(
          'Cannot resend temporary password, user has already passed setup phase.',
        );
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

    const saved = await user.save();
    const populated = await saved.populate('homeTownId');
    return this.mapUser(populated);
  }

  /**
   * Deactivates or removes a member (AP only)
   */
  async deleteMember(id: string, currentUser: IAuthUser): Promise<void> {
    if (currentUser.role !== UserRole.AP) {
      throw new ForbiddenException(
        'Only Animateurs Principaux (APs) are permitted to remove members.',
      );
    }

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Member with ID "${id}" was not found.`);
    }

    const townId = user.homeTownId;
    await this.userModel.findByIdAndDelete(id).exec();

    if (townId) {
      const pcCount = await this.countActivePcsForTown(townId);
      await this.townModel
        .findByIdAndUpdate(townId, { activePcCount: pcCount })
        .exec();
    }
  }

  async deleteAll(): Promise<void> {
    await this.userModel.deleteMany({}).exec();
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
}
