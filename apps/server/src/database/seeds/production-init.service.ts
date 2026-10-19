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

      // 2. Check if PC Ngangman Teddy is already seeded
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
            `✅ Production PC Ngangman Teddy created. Temporary password dispatched (WhatsApp: ${teddySummary.whatsappSent}, Email: ${teddySummary.emailSent}).`,
          );
        }
      } else {
        this.logger.log(
          `✅ PC Ngangman Teddy is already registered (${existingUser.email}). Skipping auto-seed.`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Database auto-initialization error: ${msg}`);
    }
  }
}
