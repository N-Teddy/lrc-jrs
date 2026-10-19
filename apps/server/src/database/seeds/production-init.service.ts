import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PhoneSanitizer } from '../../core/utils/phone-sanitizer.util';
import { UsersService } from '../../modules/users/users.service';
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

      const needsSync =
        !existingUser ||
        (existingUser.account?.allowedReadTownIds?.length || 0) < 4 ||
        existingUser.account?.status === 'MUST_CHANGE_PASSWORD';

      if (needsSync) {
        this.logger.log(
          `🌱 Syncing production credentials and town scopes for PC Ngangman Teddy (${sanitizedPhone})...`,
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
            `✅ Production PC Ngangman Teddy updated with temporary password and full town access.`,
          );
        }
      } else {
        this.logger.log(
          `✅ PC Ngangman Teddy is already verified & active (${existingUser.email}). Skipping auto-seed.`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Database auto-initialization error: ${msg}`);
    }
  }
}
