import * as crypto from 'node:crypto';
import {
  calculateAge,
  ErrorCode,
  type IAuthUser,
  type IRegistrationLink,
  type IRegistrationLinkPublicInfo,
  type IUser,
  isJrAgeEligible,
  JR_AGE_RANGE,
  UserRole,
} from '@jrs/shared';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import {
  BadRequestAppException,
  ConflictAppException,
  ForbiddenAppException,
  GoneAppException,
  NotFoundAppException,
} from '../../core/exceptions/app.exception';
import { PhoneSanitizer } from '../../core/utils/phone-sanitizer.util';
import { UserMapperUtil } from '../../core/utils/user-mapper.util';
import {
  AccountStatus,
  IntakeStatus,
  type RegistrationLinkDocument,
  type TownDocument,
  type UserDocument,
} from '../../database/schemas';
import { MediaService } from '../../services/media.service';
import { NotificationsService } from '../notifications/notifications.service';
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
    @InjectModel('RegistrationLink')
    private readonly linkModel: Model<RegistrationLinkDocument>,
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
    @InjectModel('Town')
    private readonly townModel: Model<TownDocument>,
    private readonly mediaService: MediaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Helper to map a mongoose user document to a clean IUser object
   */
  private mapUser(doc: UserDocument): IUser {
    return UserMapperUtil.mapUser(doc);
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
      throw new BadRequestAppException(ErrorCode.INTAKE_TARGET_TOWN_REQUIRED);
    }

    const townObjectId = Types.ObjectId.isValid(targetTownId)
      ? new Types.ObjectId(targetTownId)
      : (await this.townModel.findOne({ code: targetTownId.toUpperCase() }))
          ?._id;

    if (!townObjectId) {
      throw new BadRequestAppException(ErrorCode.TOWN_NOT_FOUND);
    }

    // Determine expiration
    let expiresAt: Date;
    if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
        throw new BadRequestAppException(ErrorCode.INTAKE_EXPIRATION_INVALID);
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
      throw new NotFoundAppException(ErrorCode.INTAKE_LINK_NOT_FOUND);
    }

    // Role check: PC cannot deactivate links for other towns
    if (
      currentUser.role !== UserRole.AP &&
      link.homeTownId.toString() !== currentUser.homeTownId
    ) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
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
      throw new NotFoundAppException(ErrorCode.INTAKE_LINK_NOT_FOUND);
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
      throw new NotFoundAppException(ErrorCode.INTAKE_LINK_NOT_FOUND);
    }

    // Check validity
    if (!link.isActive) {
      throw new GoneAppException(ErrorCode.INTAKE_LINK_INVALID);
    }

    const now = new Date();
    if (now > link.expiresAt) {
      throw new GoneAppException(ErrorCode.INTAKE_LINK_EXPIRED);
    }

    if (link.maxUses && link.usageCount >= link.maxUses) {
      throw new GoneAppException(ErrorCode.INTAKE_LINK_USAGE_EXCEEDED);
    }

    // Sanitize phone
    const sanitizedPhone = PhoneSanitizer.toInternationalDigits(
      dto.phoneNumber,
    );
    if (!sanitizedPhone) {
      throw new BadRequestAppException(ErrorCode.BAD_REQUEST);
    }

    // Check phone uniqueness
    const existingPhone = await this.userModel
      .findOne({ phoneNumber: sanitizedPhone })
      .exec();
    if (existingPhone) {
      if (existingPhone.intakeStatus === IntakeStatus.PENDING_REVIEW) {
        throw new ConflictAppException(ErrorCode.INTAKE_ALREADY_REVIEWED);
      }
      throw new ConflictAppException(ErrorCode.MEMBER_ALREADY_EXISTS);
    }

    // Email check if provided
    const normalizedEmail = dto.email?.trim().toLowerCase();
    if (normalizedEmail) {
      const existingEmail = await this.userModel
        .findOne({ email: normalizedEmail })
        .exec();
      if (existingEmail) {
        if (existingEmail.intakeStatus === IntakeStatus.PENDING_REVIEW) {
          throw new ConflictAppException(ErrorCode.INTAKE_ALREADY_REVIEWED);
        }
        throw new ConflictAppException(ErrorCode.MEMBER_ALREADY_EXISTS);
      }
    }

    // Age validation
    const age = calculateAge(dto.dateOfBirth);
    const isJr = isJrAgeEligible(dto.dateOfBirth);
    if (!isJr) {
      throw new BadRequestAppException(ErrorCode.MEMBER_AGE_INELIGIBLE, {
        min: JR_AGE_RANGE.MIN,
        max: JR_AGE_RANGE.MAX,
      });
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

    const town = await this.townModel.findById(link.homeTownId).exec();
    const townName = town?.name || 'Town';

    this.notificationsService
      .createNotification({
        target: {
          townId: link.homeTownId.toString(),
          roles: [UserRole.AP, UserRole.PC],
        },
        level: 'INFO',
        action: 'MEMBER_INTAKE_SUBMITTED',
        titleKey: 'notifications:memberIntakeSubmittedTitle',
        bodyKey: 'notifications:memberIntakeSubmittedBody',
        bodyParams: {
          name: newMember.fullName,
          town: townName,
        },
        resource: {
          entityType: 'INTAKE',
          entityId: newMember._id.toString(),
          townId: link.homeTownId.toString(),
          subTab: 'reviews',
        },
        sendPush: true,
      })
      .catch((err) =>
        this.logger.warn(
          `Failed to dispatch intake submission notification: ${err.message}`,
        ),
      );

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
      throw new NotFoundAppException(ErrorCode.MEMBER_NOT_FOUND);
    }

    if (member.intakeStatus !== IntakeStatus.PENDING_REVIEW) {
      throw new BadRequestAppException(ErrorCode.INTAKE_INVALID_STATUS);
    }

    // Role check: PC can only review members in their town
    if (
      currentUser.role !== UserRole.AP &&
      member.homeTownId?.toString() !== currentUser.homeTownId
    ) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
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

      const townName = (member.homeTownId as any)?.name || 'Town';
      const townIdStr =
        (member.homeTownId as any)?._id?.toString() ||
        member.homeTownId?.toString() ||
        '';

      this.notificationsService
        .createNotification(
          {
            target: {
              userIds: [member._id.toString()],
              roles: [UserRole.AP, UserRole.PC],
              townId: townIdStr,
              excludeUserIds: [currentUser.id],
            },
            level: 'SUCCESS',
            action: 'MEMBER_INTAKE_APPROVED',
            titleKey: 'notifications:memberIntakeApprovedTitle',
            bodyKey: 'notifications:memberIntakeApprovedBody',
            bodyParams: {
              town: townName,
            },
            resource: {
              entityType: 'INTAKE',
              entityId: member._id.toString(),
              townId: townIdStr,
              subTab: 'reviews',
            },
            sendPush: true,
          },
          currentUser.id,
        )
        .catch((err) =>
          this.logger.warn(
            `Failed to dispatch intake approved notification: ${err.message}`,
          ),
        );

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

      const townName = (member.homeTownId as any)?.name || 'Town';
      const townIdStr =
        (member.homeTownId as any)?._id?.toString() ||
        member.homeTownId?.toString() ||
        '';

      this.notificationsService
        .createNotification(
          {
            target: {
              roles: [UserRole.AP, UserRole.PC],
              townId: townIdStr,
              excludeUserIds: [currentUser.id],
            },
            level: 'WARNING',
            action: 'MEMBER_INTAKE_REJECTED',
            titleKey: 'notifications:memberIntakeRejectedTitle',
            bodyKey: 'notifications:memberIntakeRejectedBody',
            bodyParams: {
              town: townName,
            },
            resource: {
              entityType: 'INTAKE',
              entityId: member._id.toString(),
              townId: townIdStr,
              subTab: 'reviews',
            },
            sendPush: true,
          },
          currentUser.id,
        )
        .catch((err) =>
          this.logger.warn(
            `Failed to dispatch intake rejected notification: ${err.message}`,
          ),
        );

      return {
        success: true,
        message: `Member submission for ${member.fullName} has been rejected.`,
        member: this.mapUser(member),
      };
    }
  }
}
