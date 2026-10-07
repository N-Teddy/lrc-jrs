import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { type Model, Types } from 'mongoose';
import { PhoneSanitizer } from '../../../core/utils/phone-sanitizer.util';
import {
  Town,
  type TownDocument,
  User,
  type UserDocument,
} from '../../schemas';
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
}

@Injectable()
export class UsersSeeder {
  private readonly logger = new Logger(UsersSeeder.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Town.name) private readonly townModel: Model<TownDocument>,
  ) {}

  /**
   * Seeds users and links them to towns.
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
      this.logger.warn('Cleaning existing users collection...');
      await this.userModel.deleteMany({});
    }

    const isProd = options.mode === 'prod';
    const usersToSeed: SeedUserData[] = isProd
      ? [...SEED_ADMIN_USERS]
      : [...SEED_ADMIN_USERS, ...SEED_PC_USERS, ...SEED_MEMBER_USERS];

    const summaries: SeededUserSummary[] = [];

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
      const plainPassword = options.defaultPassword || userData.password;
      const passwordHash = await bcrypt.hash(plainPassword, 10);

      // Map allowed read town codes to object IDs
      const allowedReadTownIds = (userData.account.allowedReadTownCodes || [])
        .map((code) => townMap.get(code)?.toString())
        .filter((id): id is string => Boolean(id));

      const payload = {
        fullName: userData.fullName,
        phoneNumber: sanitizedPhone,
        email: userData.email.toLowerCase().trim(),
        passwordHash,
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

      const existing = await this.userModel.findOne({
        phoneNumber: sanitizedPhone,
      });

      if (existing) {
        await this.userModel.findByIdAndUpdate(existing._id, payload, {
          new: true,
        });
        this.logger.log(
          `Updated user: ${userData.fullName} (${userData.role}) - ${sanitizedPhone}`,
        );
      } else {
        await this.userModel.create(payload);
        this.logger.log(
          `Created user: ${userData.fullName} (${userData.role}) - ${sanitizedPhone}`,
        );
      }

      summaries.push({
        fullName: userData.fullName,
        role: userData.role,
        phoneNumber: sanitizedPhone,
        email: userData.email,
        password: plainPassword,
        townCode: userData.homeTownCode,
      });
    }

    // Refresh activePcCount on each town
    for (const [code, townId] of townMap.entries()) {
      const count = await this.userModel.countDocuments({
        homeTownId: townId,
        isActivePC: true,
        'account.isAccessRevoked': { $ne: true },
      });
      await this.townModel.findByIdAndUpdate(townId, { activePcCount: count });
      this.logger.log(`Updated active PC count for town ${code}: ${count}`);
    }

    return summaries;
  }
}
