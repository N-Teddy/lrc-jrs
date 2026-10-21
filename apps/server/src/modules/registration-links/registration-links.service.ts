import * as crypto from 'node:crypto';
import {
  calculateAge,
  type IAuthUser,
  type IRegistrationLink,
  type IRegistrationLinkPublicInfo,
  type IUser,
  isJrAgeEligible,
  JR_AGE_RANGE,
  UserRole,
} from '@jrs/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import { PhoneSanitizer } from '../../core/utils/phone-sanitizer.util';
import {
  AccountStatus,
  IntakeStatus,
  RegistrationLink,
  type RegistrationLinkDocument,
  Town,
  type TownDocument,
  User,
  type UserDocument,
} from '../../database/schemas';
import { MediaService } from '../../services/media.service';
import {
  type CreateRegistrationLinkDto,
  IntakeReviewAction,
  type PublicSubmitMemberDto,
  type ReviewMemberDto,
} from './dto';

@Injectable()
export class RegistrationLinksService {
  private readonly logger = new Logger(RegistrationLinksService.name);

  constructor(
    @InjectModel(RegistrationLink.name)
    private readonly linkModel: Model<RegistrationLinkDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Town.name)
    private readonly townModel: Model<TownDocument>,
    private readonly mediaService: MediaService,
  ) {}

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
      avatarUrl: doc.avatarUrl,
      gender: doc.gender,
      integrationDate: doc.integrationDate,
      isWhatsappVerified: doc.isWhatsappVerified,
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
        hasAppAccess: doc.account?.hasAppAccess ?? false,
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
      intakeStatus: doc.intakeStatus,
      registrationLinkId: doc.registrationLinkId?.toString(),
      intakeNote: doc.intakeNote,
      createdAt: (doc as any).createdAt?.toISOString(),
      updatedAt: (doc as any).updatedAt?.toISOString(),
    };
  }

  /**
   * Generates a new expiring registration link
   */
  async createLink(
    dto: CreateRegistrationLinkDto,
    currentUser: IAuthUser,
  ): Promise<IRegistrationLink> {
    // Determine target town
    const targetTownId =
      currentUser.role === UserRole.AP && dto.homeTownId
        ? dto.homeTownId
        : currentUser.homeTownId;

    if (!targetTownId) {
      throw new BadRequestException('A target fellowship town is required.');
    }

    const townObjectId = Types.ObjectId.isValid(targetTownId)
      ? new Types.ObjectId(targetTownId)
      : (await this.townModel.findOne({ code: targetTownId.toUpperCase() }))
          ?._id;

    if (!townObjectId) {
      throw new BadRequestException(
        'The specified fellowship town was not found.',
      );
    }

    // Determine expiration
    let expiresAt: Date;
    if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
        throw new BadRequestException('Expiration date must be in the future.');
      }
    } else {
      const hours = dto.expiresInHours || 72; // default 3 days
      expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    // Generate secure random alphanumeric token (12 chars url safe)
    const token = crypto.randomBytes(9).toString('base64url');

    const link = new this.linkModel({
      token,
      title: dto.title.trim(),
      homeTownId: townObjectId,
      createdBy: new Types.ObjectId(currentUser.id),
      expiresAt,
      isActive: true,
      usageCount: 0,
      maxUses: dto.maxUses || null,
      customMessage: dto.customMessage?.trim(),
    });

    await link.save();
    await link.populate('homeTownId');

    const populatedTown = link.homeTownId as unknown as TownDocument;

    return {
      id: link._id.toString(),
      token: link.token,
      title: link.title,
      homeTownId: link.homeTownId._id
        ? link.homeTownId._id.toString()
        : link.homeTownId.toString(),
      homeTown: populatedTown?.name
        ? {
            id: populatedTown._id.toString(),
            name: populatedTown.name,
            code: populatedTown.code,
            activePcCount: 0,
          }
        : undefined,
      createdBy: link.createdBy.toString(),
      expiresAt: link.expiresAt.toISOString(),
      isActive: link.isActive,
      usageCount: link.usageCount,
      maxUses: link.maxUses,
      customMessage: link.customMessage,
      createdAt: (link as any).createdAt?.toISOString(),
      updatedAt: (link as any).updatedAt?.toISOString(),
    };
  }

  /**
   * Retrieves all links for a given town or leader
   */
  async getLinks(
    townId?: string,
    currentUser?: IAuthUser,
  ): Promise<IRegistrationLink[]> {
    const filter: Record<string, any> = {};

    if (currentUser?.role === UserRole.AP) {
      if (townId && townId !== 'all') {
        const resolvedId = Types.ObjectId.isValid(townId)
          ? new Types.ObjectId(townId)
          : (await this.townModel.findOne({ code: townId.toUpperCase() }))?._id;
        if (resolvedId) filter.homeTownId = resolvedId;
      }
    } else if (currentUser?.homeTownId) {
      const resolvedId = Types.ObjectId.isValid(currentUser.homeTownId)
        ? new Types.ObjectId(currentUser.homeTownId)
        : (
            await this.townModel.findOne({
              code: currentUser.homeTownId.toUpperCase(),
            })
          )?._id;
      if (resolvedId) filter.homeTownId = resolvedId;
    }

    const links = await this.linkModel
      .find(filter)
      .populate('homeTownId')
      .sort({ createdAt: -1 })
      .exec();

    return links.map((link) => {
      const populatedTown = link.homeTownId as unknown as TownDocument;
      return {
        id: link._id.toString(),
        token: link.token,
        title: link.title,
        homeTownId: link.homeTownId._id
          ? link.homeTownId._id.toString()
          : link.homeTownId.toString(),
        homeTown: populatedTown?.name
          ? {
              id: populatedTown._id.toString(),
              name: populatedTown.name,
              code: populatedTown.code,
              activePcCount: 0,
            }
          : undefined,
        createdBy: link.createdBy.toString(),
        expiresAt: link.expiresAt.toISOString(),
        isActive: link.isActive,
        usageCount: link.usageCount,
        maxUses: link.maxUses,
        customMessage: link.customMessage,
        createdAt: (link as any).createdAt?.toISOString(),
        updatedAt: (link as any).updatedAt?.toISOString(),
      };
    });
  }

  /**
   * Deactivates a link immediately
   */
  async deactivateLink(
    linkId: string,
    currentUser: IAuthUser,
  ): Promise<{ success: boolean; message: string }> {
    const link = await this.linkModel.findById(linkId).exec();
    if (!link) {
      throw new NotFoundException('Registration link not found.');
    }

    // Role check: PC cannot deactivate links for other towns
    if (
      currentUser.role !== UserRole.AP &&
      link.homeTownId.toString() !== currentUser.homeTownId
    ) {
      throw new ForbiddenException(
        'You can only manage registration links for your home town.',
      );
    }

    link.isActive = false;
    await link.save();

    return {
      success: true,
      message: 'Registration link deactivated successfully.',
    };
  }

  /**
   * Public info query to validate token and return presentation metadata
   */
  async getPublicLinkInfo(token: string): Promise<IRegistrationLinkPublicInfo> {
    const link = await this.linkModel
      .findOne({ token })
      .populate('homeTownId')
      .exec();

    if (!link) {
      throw new NotFoundException(
        'This member intake link does not exist or has been removed.',
      );
    }

    const now = new Date();
    const isExpired =
      now > link.expiresAt ||
      !link.isActive ||
      Boolean(link.maxUses && link.usageCount >= link.maxUses);

    const town = link.homeTownId as unknown as TownDocument;

    return {
      token: link.token,
      title: link.title,
      town: {
        id: town?._id?.toString() || link.homeTownId.toString(),
        name: town?.name || 'Local Fellowship Town',
        code: town?.code || 'JRS',
      },
      expiresAt: link.expiresAt.toISOString(),
      isExpired,
      isActive: link.isActive,
      customMessage: link.customMessage,
    };
  }

  /**
   * Public submission of member registration through the link
   */
  async publicSubmitMember(
    token: string,
    dto: PublicSubmitMemberDto,
    file?: Express.Multer.File,
  ): Promise<{
    success: boolean;
    referenceCode: string;
    fullName: string;
    memberId: string;
    message: string;
  }> {
    const link = await this.linkModel.findOne({ token }).exec();
    if (!link) {
      throw new NotFoundException(
        'This member intake link does not exist or has been removed.',
      );
    }

    // Check validity
    if (!link.isActive) {
      throw new GoneException(
        'This registration link has been deactivated by fellowship leadership.',
      );
    }

    const now = new Date();
    if (now > link.expiresAt) {
      throw new GoneException(
        'This registration link has expired. Please request a new link from your fellowship leader.',
      );
    }

    if (link.maxUses && link.usageCount >= link.maxUses) {
      throw new GoneException(
        'This registration link has reached its maximum quota of submissions.',
      );
    }

    // Sanitize phone
    const sanitizedPhone = PhoneSanitizer.toInternationalDigits(
      dto.phoneNumber,
    );
    if (!sanitizedPhone) {
      throw new BadRequestException(
        'Please enter a valid Cameroon phone number (e.g. +237 671 234 567).',
      );
    }

    // Check phone uniqueness
    const existingPhone = await this.userModel
      .findOne({ phoneNumber: sanitizedPhone })
      .exec();
    if (existingPhone) {
      if (existingPhone.intakeStatus === IntakeStatus.PENDING_REVIEW) {
        throw new ConflictException(
          'A registration with this phone number has already been submitted and is currently pending leader review.',
        );
      }
      throw new ConflictException(
        'A fellowship member with this phone number is already registered in the system.',
      );
    }

    // Email check if provided
    const normalizedEmail = dto.email?.trim().toLowerCase();
    if (normalizedEmail) {
      const existingEmail = await this.userModel
        .findOne({ email: normalizedEmail })
        .exec();
      if (existingEmail) {
        throw new ConflictException(
          'A member with this email address is already registered in the system.',
        );
      }
    }

    // Age validation
    const age = calculateAge(dto.dateOfBirth);
    const isJr = isJrAgeEligible(dto.dateOfBirth);
    if (!isJr) {
      throw new BadRequestException(
        `Youth fellowship members must be aged between ${JR_AGE_RANGE.MIN} and ${JR_AGE_RANGE.MAX} years old (calculated age: ${age}).`,
      );
    }

    // Avatar resolution
    let avatarUrl = dto.avatarUrl;
    if (file) {
      try {
        avatarUrl = await this.mediaService.uploadAvatar(file);
      } catch (err) {
        this.logger.warn(
          `Failed uploading uploaded avatar file, generating default: ${(err as Error)?.message}`,
        );
        avatarUrl = await this.mediaService.generateAndSaveDefaultAvatar(
          dto.fullName,
          sanitizedPhone,
          dto.gender,
        );
      }
    } else if (!avatarUrl) {
      avatarUrl = await this.mediaService.generateAndSaveDefaultAvatar(
        dto.fullName,
        sanitizedPhone,
        dto.gender,
      );
    }

    // Create user with intakeStatus: PENDING_REVIEW & hasAppAccess: FALSE
    const newMember = new this.userModel({
      fullName: dto.fullName.trim(),
      phoneNumber: sanitizedPhone,
      email: normalizedEmail || undefined,
      avatarUrl,
      gender: dto.gender,
      dateOfBirth: dto.dateOfBirth,
      isJr: true,
      homeTownId: link.homeTownId,
      role: UserRole.MEMBER,
      isActivePC: false,
      intakeStatus: IntakeStatus.PENDING_REVIEW,
      registrationLinkId: link._id,
      intakeNote: dto.intakeNote?.trim() || undefined,
      integrationDate: dto.integrationDate?.trim() || undefined,
      account: {
        status: AccountStatus.PENDING_ACTIVATION,
        hasAppAccess: false, // CRUCIAL CONSTRAINT: members created through this method will not have access to the app
        isAccessRevoked: false,
        allowedReadTownIds: [],
      },
    });

    await newMember.save();

    // Increment link usage
    link.usageCount += 1;
    await link.save();

    const shortId = newMember._id.toString().slice(-6).toUpperCase();
    const referenceCode = `JRS-${shortId}`;

    return {
      success: true,
      referenceCode,
      fullName: newMember.fullName,
      memberId: newMember._id.toString(),
      message:
        'Your profile has been successfully submitted and is awaiting leader review.',
    };
  }

  /**
   * Retrieves all members awaiting review for a given town or leader
   */
  async getPendingReviewMembers(
    townId?: string,
    currentUser?: IAuthUser,
  ): Promise<IUser[]> {
    const filter: Record<string, any> = {
      intakeStatus: IntakeStatus.PENDING_REVIEW,
    };

    if (currentUser?.role === UserRole.AP) {
      if (townId && townId !== 'all') {
        const resolvedId = Types.ObjectId.isValid(townId)
          ? new Types.ObjectId(townId)
          : (await this.townModel.findOne({ code: townId.toUpperCase() }))?._id;
        if (resolvedId) filter.homeTownId = resolvedId;
      }
    } else if (currentUser?.homeTownId) {
      const resolvedId = Types.ObjectId.isValid(currentUser.homeTownId)
        ? new Types.ObjectId(currentUser.homeTownId)
        : (
            await this.townModel.findOne({
              code: currentUser.homeTownId.toUpperCase(),
            })
          )?._id;
      if (resolvedId) filter.homeTownId = resolvedId;
    }

    const members = await this.userModel
      .find(filter)
      .populate('homeTownId')
      .sort({ createdAt: -1 })
      .exec();

    return members.map((doc) => this.mapUser(doc));
  }

  /**
   * Reviews a pending member submission (Approve or Reject)
   */
  async reviewMember(
    memberId: string,
    dto: ReviewMemberDto,
    currentUser: IAuthUser,
  ): Promise<{ success: boolean; message: string; member: IUser }> {
    const member = await this.userModel
      .findById(memberId)
      .populate('homeTownId')
      .exec();
    if (!member) {
      throw new NotFoundException('Member record not found.');
    }

    if (member.intakeStatus !== IntakeStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `Member is not pending review (current status: ${member.intakeStatus}).`,
      );
    }

    // Role check: PC can only review members in their town
    if (
      currentUser.role !== UserRole.AP &&
      member.homeTownId?.toString() !== currentUser.homeTownId
    ) {
      throw new ForbiddenException(
        'You only have permission to review members in your assigned town.',
      );
    }

    if (dto.action === IntakeReviewAction.APPROVE) {
      member.intakeStatus = IntakeStatus.APPROVED;
      // Grant app access only if explicitly chosen by leader
      if (dto.grantAppAccess === true) {
        member.account.hasAppAccess = true;
      } else {
        member.account.hasAppAccess = false;
      }

      if (dto.notes) {
        member.intakeNote = member.intakeNote
          ? `${member.intakeNote} | Note: ${dto.notes}`
          : dto.notes;
      }

      await member.save();

      return {
        success: true,
        message: `Member ${member.fullName} has been approved.`,
        member: this.mapUser(member),
      };
    } else {
      member.intakeStatus = IntakeStatus.REJECTED;
      if (dto.notes) {
        member.intakeNote = member.intakeNote
          ? `${member.intakeNote} | Rejection Reason: ${dto.notes}`
          : `Rejection Reason: ${dto.notes}`;
      }

      await member.save();

      return {
        success: true,
        message: `Member submission for ${member.fullName} has been rejected.`,
        member: this.mapUser(member),
      };
    }
  }
}
