import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { TransfersSeeder } from './seeders/transfers.seeder';

interface TransferCliOptions {
  clean: boolean;
  count?: number;
}

function parseCliArgs(): TransferCliOptions {
  const args = process.argv.slice(2);
  const options: TransferCliOptions = {
    clean: false,
  };

  for (const arg of args) {
    if (arg === '--clean' || arg === '--reset') {
      options.clean = true;
    } else if (arg.startsWith('--count=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!Number.isNaN(val) && val > 0) {
        options.count = val;
      }
    }
  }

  return options;
}

async function bootstrap() {
  const logger = new Logger('SeedTransfersCLI');
  const options = parseCliArgs();

  logger.log('====================================================');
  logger.log(
    `🔄 INITIATING TOWN TRANSFERS FOR NON-AP & NON-PC MEMBERS (Clean: ${options.clean})`,
  );
  logger.log('====================================================');

  try {
    const app = await NestFactory.createApplicationContext(SeedModule, {
      logger: ['error', 'warn', 'log'],
    });

    const transfersSeeder = app.get(TransfersSeeder);
    const result = await transfersSeeder.seed(undefined, {
      clean: options.clean,
      targetCount: options.count,
    });

    logger.log('====================================================');
    logger.log(
      `🎉 TOWN TRANSFERS SEEDING COMPLETED: ${result.transferredMembersCount} members transferred (${result.totalTransfersCount} total transfer events).`,
    );
    logger.log('====================================================');

    if (result.summaries.length > 0) {
      console.log(
        '\n📋 AUDIT TRAIL OF SEEDED TOWN TRANSFERS (NON-AP & NON-PC MEMBERS ONLY):\n',
      );
      console.table(
        result.summaries.map((s) => ({
          Name: s.fullName,
          Phone: s.phoneNumber,
          Role: s.role,
          'Origin Hub': s.originTownCode,
          'Resident Hub': s.currentTownCode,
          Transfers: s.totalTransfers,
          Initiator: s.transferredBy,
          'Pastoral Reason':
            s.lastReason.length > 55
              ? `${s.lastReason.substring(0, 52)}...`
              : s.lastReason,
        })),
      );
    }

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to seed town transfers:', error);
    process.exit(1);
  }
}

bootstrap();
