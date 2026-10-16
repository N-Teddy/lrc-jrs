import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { type Model, Types } from 'mongoose';
import { PasswordGeneratorUtil } from '../../../core/utils/password-generator.util';
import { PhoneSanitizer } from '../../../core/utils/phone-sanitizer.util';
import { UsersService } from '../../../modules/users/users.service';
import { EmailService } from '../../../services/email.service';
import { AccountStatus, Town, type TownDocument } from '../../schemas';
import { SEED_MEMBERS_NO_APP_ACCESS } from '../data/members-no-access.data';
import {
  SEED_ADMIN_USERS,
  SEED_MEMBER_USERS,
  SEED_PC_USERS,
  type SeedUserData,
} from '../data/users.data';

export interface SeededUserSummary {
  fullName: string;
  role: string;
  phoneNumber: string;
  email: string;
  password: string;
  townCode: string;
  hasAppAccess: boolean;
  emailSent: boolean;
  isTemporary?: boolean;
}

@Injectable()
export class UsersSeeder {
  private readonly logger = new Logger(UsersSeeder.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    @InjectModel(Town.name) private readonly townModel: Model<TownDocument>,
  ) {}

  /**
   * Seeds users using the existing UsersService, auto-generates credentials,
   * and emails users who have application access.
   */
  async seed(
    townMap: Map<string, Types.ObjectId>,
    options: {
      clean?: boolean;
      mode?: 'dev' | 'prod';
      defaultPassword?: string;
    } = {},
  ): Promise<SeededUserSummary[]> {
    if (options.clean) {
      this.logger.warn(
        'Cleaning existing users collection via UsersService...',
      );
      await this.usersService.deleteAll();
    }

    const isProd = options.mode === 'prod';
    const primaryUsers: SeedUserData[] = isProd
      ? [...SEED_ADMIN_USERS]
      : [...SEED_ADMIN_USERS, ...SEED_PC_USERS, ...SEED_MEMBER_USERS];

    const usersToSeed: SeedUserData[] = isProd
      ? primaryUsers
      : [...primaryUsers, ...SEED_MEMBERS_NO_APP_ACCESS];

    const summaries: SeededUserSummary[] = [];

    // Pre-calculate dummy password hash for members without app access to optimize speed
    const noAccessPasswordHash = await bcrypt.hash('NoAppAccessPass2026!', 10);

    let noAccessCount = 0;

    for (const userData of usersToSeed) {
      const townId = townMap.get(userData.homeTownCode);
      if (!townId) {
        this.logger.error(
          `Town not found for code '${userData.homeTownCode}'. Skipping user ${userData.fullName}.`,
        );
        continue;
      }

      const sanitizedPhone = PhoneSanitizer.toInternationalDigits(
        userData.phoneNumber,
      );

      const hasAppAccess = Boolean(
        userData.account.hasAppAccess &&
          !userData.account.isAccessRevoked &&
          userData.email,
      );

      const isTemporary =
        userData.isTemporaryPassword ??
        userData.account.status === AccountStatus.MUST_CHANGE_PASSWORD;

      let plainPassword = userData.password || options.defaultPassword;
      if (!plainPassword) {
        plainPassword = hasAppAccess
          ? PasswordGeneratorUtil.generateTemporaryPassword()
          : 'NoAppAccessPass2026!';
      }

      let passwordHash: string;
      let tempPasswordHash: string | undefined;
      let tempPasswordExpiresAt: Date | undefined;

      if (hasAppAccess) {
        if (isTemporary) {
          tempPasswordHash = await bcrypt.hash(plainPassword, 10);
          passwordHash = tempPasswordHash;
          tempPasswordExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h validity
        } else {
          passwordHash = await bcrypt.hash(plainPassword, 10);
          tempPasswordHash = undefined;
          tempPasswordExpiresAt = undefined;
        }
      } else {
        passwordHash = noAccessPasswordHash;
        if (userData.password) {
          tempPasswordHash = await bcrypt.hash(userData.password, 10);
          tempPasswordExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
        }
      }

      // Map allowed read town codes to object IDs
      const allowedReadTownIds = (userData.account.allowedReadTownCodes || [])
        .map((code) => townMap.get(code)?.toString())
        .filter((id): id is string => Boolean(id));

      const payload: Record<string, unknown> = {
        fullName: userData.fullName,
        phoneNumber: sanitizedPhone,
        email: userData.email.toLowerCase().trim(),
        passwordHash,
        tempPasswordHash,
        tempPasswordExpiresAt,
        isTemporaryPassword: isTemporary,
        dateOfBirth: userData.dateOfBirth,
        isJr: userData.isJr,
        role: userData.role,
        isActivePC: userData.isActivePC,
        homeTownId: townId,
        account: {
          status: userData.account.status,
          hasAppAccess: userData.account.hasAppAccess,
          isAccessRevoked: userData.account.isAccessRevoked ?? false,
          allowedReadTownIds,
        },
      };

      const existing = await this.usersService.findByPhone(sanitizedPhone);
      if (existing) {
        if (!isTemporary) {
          await this.usersService.update(existing._id, {
            ...payload,
            $unset: { tempPasswordHash: 1, tempPasswordExpiresAt: 1 },
          } as any);
        } else {
          await this.usersService.update(existing._id, payload as any);
        }
      } else {
        await this.usersService.create(payload as any);
      }

      // Send email notification to users who have application access
      let emailSent = false;
      if (hasAppAccess && isTemporary) {
        try {
          emailSent = await this.emailService.sendTemporaryPasswordEmail(
            userData.email,
            {
              fullName: userData.fullName,
              tempPassword: plainPassword,
              expiresInHours: 48,
              loginUrl: 'http://localhost:5173/login',
            },
          );
          if (emailSent) {
            this.logger.log(
              `📧 Sent temporary password email to ${userData.email}`,
            );
          }
        } catch (emailErr) {
          this.logger.warn(
            `Could not dispatch email to ${userData.email}: ${emailErr}`,
          );
        }
      }

      if (hasAppAccess) {
        summaries.push({
          fullName: userData.fullName,
          role: userData.role,
          phoneNumber: sanitizedPhone,
          email: userData.email,
          password: plainPassword,
          townCode: userData.homeTownCode,
          hasAppAccess: true,
          emailSent,
          isTemporary,
        });
      } else {
        noAccessCount++;
      }
    }

    if (noAccessCount > 0) {
      this.logger.log(
        `👥 Successfully seeded ${noAccessCount} standard JR members without application access across towns.`,
      );
    }

    // Refresh activePcCount on each town using UsersService
    for (const [code, townId] of townMap.entries()) {
      const count = await this.usersService.countActivePcsForTown(townId);
      await this.townModel.findByIdAndUpdate(townId, { activePcCount: count });
      this.logger.log(`Updated active PC count for town ${code}: ${count}`);
    }

    return summaries;
  }
}
