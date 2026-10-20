import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PhoneSanitizer } from '../../core/utils/phone-sanitizer.util';
import { UsersService } from '../../modules/users/users.service';
import { MediaService } from '../../services/media.service';
import { SEED_PROD_PC_USER } from './data/users.data';
import { TownsSeeder } from './seeders/towns.seeder';
import { UsersSeeder } from './seeders/users.seeder';

@Injectable()
export class ProductionInitService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductionInitService.name);

  constructor(
    private readonly townsSeeder: TownsSeeder,
    private readonly usersSeeder: UsersSeeder,
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
  ) {}

  async onApplicationBootstrap() {
    try {
      this.logger.log('🔍 Checking database initialization status...');

      // 1. Ensure core towns exist (Douala, Yaoundé, Edéa, Bafoussam) without dropping
      const townMap = await this.townsSeeder.seed({ clean: false });

      // 2. Ensure PC Ngangman Teddy is seeded and has full town access
      const sanitizedPhone = PhoneSanitizer.toInternationalDigits(
        SEED_PROD_PC_USER.phoneNumber,
      );
      const existingUser = await this.usersService.findByPhone(sanitizedPhone);

      if (!existingUser) {
        this.logger.log(
          `🌱 PC Ngangman Teddy (${sanitizedPhone}) not found. Auto-seeding production credentials...`,
        );

        const summaries = await this.usersSeeder.seed(townMap, {
          clean: false,
          mode: 'prod',
        });

        const teddySummary = summaries.find(
          (u) => u.phoneNumber === sanitizedPhone,
        );

        if (teddySummary) {
          this.logger.log(
            `✅ Production PC Ngangman Teddy created with temporary credentials.`,
          );
        }
      } else {
        // User already exists: ensure full town read scope without resetting credentials or re-dispatching
        const allTownIds = Array.from(townMap.values()).map((id) =>
          id.toString(),
        );
        const currentAllowedIds =
          existingUser.account?.allowedReadTownIds || [];
        const missingTownIds = allTownIds.filter(
          (id) => !currentAllowedIds.includes(id),
        );

        const updates: Record<string, any> = {};

        if (missingTownIds.length > 0) {
          this.logger.log(
            `🔄 Syncing missing town scopes for PC Ngangman Teddy (${allTownIds.length} towns)...`,
          );
          updates.account = {
            ...existingUser.account,
            allowedReadTownIds: allTownIds,
          };
        }

        const isBrokenAvatar =
          !existingUser.avatarUrl ||
          existingUser.avatarUrl.includes('/raw/upload/');

        if (isBrokenAvatar) {
          try {
            this.logger.log(
              `🎨 Generating valid avatar for PC Ngangman Teddy...`,
            );
            const avatarUrl =
              await this.mediaService.generateAndSaveDefaultAvatar(
                existingUser.fullName,
                sanitizedPhone,
                existingUser.gender || 'MALE',
              );
            updates.avatarUrl = avatarUrl;
          } catch (avatarErr) {
            this.logger.warn(
              `Could not generate avatar for PC Ngangman Teddy: ${avatarErr}`,
            );
          }
        }

        if (Object.keys(updates).length > 0) {
          await this.usersService.update(existingUser._id, updates as any);
        }

        this.logger.log(
          `✅ PC Ngangman Teddy is already initialized (${existingUser.email}). Skipping credential re-seed.`,
        );
      }

      // 3. Auto-populate missing avatars for any existing users in the database
      const usersNeedingAvatars =
        await this.usersService.findUsersWithoutAvatars();
      if (usersNeedingAvatars.length > 0) {
        this.logger.log(
          `🎨 Found ${usersNeedingAvatars.length} user(s) with missing avatars. Auto-generating...`,
        );
        for (const u of usersNeedingAvatars) {
          try {
            const identifier = u.phoneNumber || u._id.toString();
            const avatarUrl =
              await this.mediaService.generateAndSaveDefaultAvatar(
                u.fullName,
                identifier,
                u.gender,
              );
            await this.usersService.update(u._id, { avatarUrl } as any);
          } catch (err) {
            this.logger.warn(
              `Failed generating avatar for "${u.fullName}": ${err}`,
            );
          }
        }
        this.logger.log(`✅ Finished generating missing avatars.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Database auto-initialization error: ${msg}`);
    }
  }
}
