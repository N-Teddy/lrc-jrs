import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MediaService } from '../../services/media.service';
import { User, type UserDocument } from '../schemas';
import { SeedModule } from './seed.module';

async function bootstrap() {
  const logger = new Logger('GenerateAvatars');
  const force = process.argv.includes('--force');
  const clean = process.argv.includes('--clean') || force;

  logger.log(
    `Starting avatar generation script for existing users (Force: ${force}, Clean: ${clean})...`,
  );

  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const mediaService = app.get(MediaService);

    if (clean) {
      const avatarsDir = path.join(process.cwd(), 'uploads', 'avatars');
      if (fs.existsSync(avatarsDir)) {
        const files = await fs.promises.readdir(avatarsDir);
        for (const file of files) {
          try {
            await fs.promises.unlink(path.join(avatarsDir, file));
          } catch (e) {
            logger.warn(`Could not remove ${file}: ${(e as Error)?.message}`);
          }
        }
        logger.log(`Cleaned up ${files.length} old avatar files from disk.`);
      }
    }

    // If not in force mode, only find users with missing or empty avatarUrl
    const query = force
      ? {}
      : {
          $or: [
            { avatarUrl: { $exists: false } },
            { avatarUrl: null },
            { avatarUrl: '' },
          ],
        };

    const users = await userModel.find(query).exec();
    logger.log(`Found ${users.length} member(s) needing avatar generation.`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const user of users) {
      try {
        const identifier = user.phoneNumber || user._id.toString();
        const avatarUrl = await mediaService.generateAndSaveDefaultAvatar(
          user.fullName,
          identifier,
        );

        user.avatarUrl = avatarUrl;
        await user.save();
        updatedCount++;

        logger.log(
          `[${updatedCount}/${users.length}] Generated avatar for "${user.fullName}": ${avatarUrl}`,
        );
      } catch (err) {
        failedCount++;
        logger.error(
          `Failed generating avatar for "${user.fullName}" (${user._id}): ${(err as Error)?.message}`,
        );
      }
    }

    logger.log('====================================================');
    logger.log(`Finished processing existing users!`);
    logger.log(`Total scanned: ${users.length}`);
    logger.log(`Successfully updated: ${updatedCount}`);
    if (failedCount > 0) {
      logger.warn(`Failed: ${failedCount}`);
    }
    logger.log('====================================================');

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('Fatal error during avatar generation script:', error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();
