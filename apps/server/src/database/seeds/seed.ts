import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedRunOptions, SeedService } from './seed.service';

function parseCliArgs(): SeedRunOptions {
  const args = process.argv.slice(2);
  const options: SeedRunOptions = {
    clean: false,
    mode: 'dev',
  };

  for (const arg of args) {
    if (arg === '--clean' || arg === '--fresh') {
      options.clean = true;
    } else if (arg.startsWith('--mode=')) {
      const mode = arg.split('=')[1]?.toLowerCase();
      if (mode === 'prod' || mode === 'dev') {
        options.mode = mode;
      }
    } else if (arg.startsWith('--password=')) {
      options.defaultPassword = arg.split('=')[1];
    }
  }

  return options;
}

async function bootstrap() {
  const logger = new Logger('SeedCLI');
  const options = parseCliArgs();

  try {
    const app = await NestFactory.createApplicationContext(SeedModule, {
      logger: ['error', 'warn', 'log'],
    });

    const seedService = app.get(SeedService);
    await seedService.run(options);

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('Failed to run database seed:', error);
    process.exit(1);
  }
}

bootstrap();
