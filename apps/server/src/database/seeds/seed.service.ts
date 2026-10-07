import { Injectable, Logger } from '@nestjs/common';
import { TownsSeeder } from './seeders/towns.seeder';
import { type SeededUserSummary, UsersSeeder } from './seeders/users.seeder';

export interface SeedRunOptions {
  clean?: boolean;
  mode?: 'dev' | 'prod';
  defaultPassword?: string;
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly townsSeeder: TownsSeeder,
    private readonly usersSeeder: UsersSeeder,
  ) {}

  async run(options: SeedRunOptions = {}): Promise<void> {
    const startTime = Date.now();
    const mode = options.mode || 'dev';
    const clean = Boolean(options.clean);

    this.logger.log('====================================================');
    this.logger.log(
      `🌱 STARTING DATABASE SEED (Mode: ${mode.toUpperCase()}, Clean: ${clean})`,
    );
    this.logger.log('====================================================');

    try {
      // 1. Seed Towns
      this.logger.log('📍 Phase 1: Seeding Towns...');
      const townMap = await this.townsSeeder.seed({ clean });
      this.logger.log(`✅ Seeded ${townMap.size} towns successfully.`);

      // 2. Seed Users
      this.logger.log('👥 Phase 2: Seeding Users...');
      const userSummaries = await this.usersSeeder.seed(townMap, {
        clean,
        mode,
        defaultPassword: options.defaultPassword,
      });
      this.logger.log(`✅ Seeded ${userSummaries.length} users successfully.`);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log('====================================================');
      this.logger.log(`🎉 SEEDING COMPLETED SUCCESSFULLY in ${elapsed}s`);
      this.logger.log('====================================================');

      this.printCredentialsTable(userSummaries);
    } catch (error) {
      this.logger.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  private printCredentialsTable(users: SeededUserSummary[]): void {
    if (!users.length) return;

    // Format a neat console table
    console.log('\n🔑 SEEDED USERS & TEST CREDENTIALS:\n');
    console.table(
      users.map((u) => ({
        Name: u.fullName,
        Role: u.role,
        Town: u.townCode,
        Phone: u.phoneNumber,
        Email: u.email,
        'Temp Password': u.password,
        'App Access': u.hasAppAccess ? 'Yes' : 'No',
        'Email Status': !u.hasAppAccess
          ? '— (No App Access)'
          : u.emailSent
            ? '✅ Dispatched'
            : '⚠️ SMTP Offline (Maildev not running)',
      })),
    );
    console.log(
      '\n💡 You can use these credentials to authenticate via POST /api/auth/login\n',
    );
  }
}
