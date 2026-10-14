import * as fs from 'node:fs';
import * as path from 'node:path';
import 'multer';
import {
  adventurer,
  avataaars,
  bottts,
  funEmoji,
  lorelei,
  openPeeps,
  personas,
} from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

const AVATAR_STYLES: Record<string, any> = {
  avataaars,
  lorelei,
  adventurer,
  openpeeps: openPeeps,
  personas,
  bottts,
  funemoji: funEmoji,
};

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir: string;
  private readonly storageDriver: 'local' | 'cloudinary';
  private readonly baseUrl: string;
  private readonly isProd: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const explicitDriver = this.configService.get<string>(
      'MEDIA_STORAGE_DRIVER',
    );
    this.storageDriver =
      (explicitDriver as 'local' | 'cloudinary') ||
      (this.isProd ? 'cloudinary' : 'local');

    const port = this.configService.get<number>('PORT', 3000);
    const host =
      this.configService.get<string>('APP_URL') || `http://localhost:${port}`;
    this.baseUrl = host.replace(/\/$/, '');

    const customUploadDir = this.configService.get<string>('UPLOAD_DIR');
    this.uploadDir = customUploadDir
      ? path.resolve(customUploadDir)
      : path.join(process.cwd(), 'uploads');

    // Initialize Cloudinary if credentials are present
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.logger.log(`Cloudinary configured for cloud "${cloudName}".`);
    } else if (this.storageDriver === 'cloudinary') {
      this.logger.warn(
        'Cloudinary credentials are not configured. Falling back to local storage driver.',
      );
    }
  }

  async onModuleInit() {
    await this.ensureDirectoriesExist();
    this.logger.log(
      `MediaService initialized [Driver: ${this.storageDriver}] (Local storage path: ${this.uploadDir})`,
    );
  }

  private async ensureDirectoriesExist(): Promise<void> {
    try {
      const avatarsDir = path.join(this.uploadDir, 'avatars');
      await fs.promises.mkdir(avatarsDir, { recursive: true });
    } catch (err) {
      this.logger.error(
        `Failed to ensure upload directories exist: ${(err as Error)?.message}`,
      );
    }
  }

  /**
   * Upload an avatar image provided via Multer.
   */
  async uploadAvatar(file: Express.Multer.File): Promise<string> {
    if (!file?.buffer) {
      throw new BadRequestException('No file buffer provided for upload.');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'image/gif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Allowed types are JPEG, PNG, WEBP, SVG, and GIF.`,
      );
    }

    if (this.shouldUseCloudinary()) {
      return this.uploadBufferToCloudinary(
        file.buffer,
        'avatars',
        file.mimetype,
      );
    }

    return this.saveBufferLocally(
      file.buffer,
      'avatars',
      file.originalname,
      file.mimetype,
    );
  }

  /**
   * Generates a unique cartoon illustration avatar (SVG) based on a user's name/identifier and gender, and persists it.
   */
  async generateAndSaveDefaultAvatar(
    seedName: string,
    identifier?: string,
    gender?: 'MALE' | 'FEMALE' | string,
  ): Promise<string> {
    const chosenStyleKey = (
      this.configService.get<string>('MEDIA_AVATAR_STYLE', 'avataaars') ||
      'avataaars'
    ).toLowerCase();

    const selectedStyle = AVATAR_STYLES[chosenStyleKey] || avataaars;

    const normalizedGender = gender ? gender.toUpperCase() : undefined;
    const isMale = normalizedGender === 'MALE';
    const isFemale = normalizedGender === 'FEMALE';

    const avatarOptions: Record<string, any> = {
      seed: seedName || identifier || 'Member',
      backgroundColor: [
        'b6e3f4',
        'c0aede',
        'd1d4f9',
        'ffd5dc',
        'ffdfbf',
        'd1f4e0',
        'e2d4f9',
        'fed1d6',
      ],
    };

    if (chosenStyleKey === 'avataaars') {
      if (isMale) {
        avatarOptions.top = [
          'shortCurly',
          'shortFlat',
          'shortRound',
          'shortWaved',
          'theCaesar',
          'theCaesarAndSidePart',
          'shavedSides',
          'sides',
          'dreads01',
          'dreads02',
          'frizzle',
          'shaggy',
          'shaggyMullet',
        ];
        avatarOptions.facialHair = [
          'beardLight',
          'beardMedium',
          'beardMajestic',
          'moustacheFancy',
          'moustacheMagnum',
        ];
        avatarOptions.facialHairProbability = 35;
      } else if (isFemale) {
        avatarOptions.top = [
          'longButNotTooLong',
          'straight01',
          'straight02',
          'straightAndStrand',
          'curvy',
          'curly',
          'bob',
          'bun',
          'miaWallace',
          'fro',
          'froBand',
          'dreads',
          'bigHair',
        ];
        avatarOptions.facialHairProbability = 0;
      }
    } else if (chosenStyleKey === 'lorelei') {
      if (isMale) {
        avatarOptions.beardProbability = 35;
        avatarOptions.hairAccessoriesProbability = 0;
        avatarOptions.earringsProbability = 5;
      } else if (isFemale) {
        avatarOptions.beardProbability = 0;
        avatarOptions.hairAccessoriesProbability = 40;
        avatarOptions.earringsProbability = 60;
      }
    } else if (chosenStyleKey === 'personas') {
      if (isMale) {
        avatarOptions.facialHairProbability = 35;
      } else if (isFemale) {
        avatarOptions.facialHairProbability = 0;
      }
    }

    const avatar = createAvatar(selectedStyle, avatarOptions);

    const svgString = avatar.toString();
    const buffer = Buffer.from(svgString, 'utf-8');
    const safeBaseName = (identifier || seedName || 'avatar')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const filename = `${safeBaseName}-${Date.now()}.svg`;

    if (this.shouldUseCloudinary()) {
      return this.uploadBufferToCloudinary(buffer, 'avatars', 'image/svg+xml');
    }

    return this.saveBufferLocally(buffer, 'avatars', filename, 'image/svg+xml');
  }

  /**
   * Determines whether to upload to Cloudinary.
   */
  private shouldUseCloudinary(): boolean {
    const hasCloudinaryCreds =
      Boolean(this.configService.get<string>('CLOUDINARY_CLOUD_NAME')) &&
      Boolean(this.configService.get<string>('CLOUDINARY_API_KEY')) &&
      Boolean(this.configService.get<string>('CLOUDINARY_API_SECRET'));

    return this.storageDriver === 'cloudinary' && hasCloudinaryCreds;
  }

  /**
   * Save a file buffer to local disk in dev mode.
   */
  private async saveBufferLocally(
    buffer: Buffer,
    subfolder: string,
    originalName: string,
    mimeType: string,
  ): Promise<string> {
    await this.ensureDirectoriesExist();

    const ext = this.resolveExtension(originalName, mimeType);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const targetFolder = path.join(this.uploadDir, subfolder);
    await fs.promises.mkdir(targetFolder, { recursive: true });

    const targetFilePath = path.join(targetFolder, uniqueName);
    await fs.promises.writeFile(targetFilePath, buffer);

    this.logger.debug(`Saved local media file to: ${targetFilePath}`);
    return `${this.baseUrl}/uploads/${subfolder}/${uniqueName}`;
  }

  /**
   * Stream a buffer upload to Cloudinary in production mode.
   */
  private async uploadBufferToCloudinary(
    buffer: Buffer,
    subfolder: string,
    mimeType: string,
  ): Promise<string> {
    const cloudFolder = this.configService.get<string>(
      'CLOUDINARY_FOLDER',
      `lrc-jrs/${subfolder}`,
    );

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: cloudFolder,
          resource_type: mimeType === 'image/svg+xml' ? 'raw' : 'image',
        },
        (error: any, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error(
              `Cloudinary upload failed: ${error?.message || 'Unknown error'}`,
            );
            return reject(
              new BadRequestException(
                `Failed to upload media to cloud storage: ${error?.message}`,
              ),
            );
          }
          this.logger.debug(
            `Uploaded media to Cloudinary: ${result.secure_url}`,
          );
          resolve(result.secure_url);
        },
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Helper to derive file extension from filename or mime type.
   */
  private resolveExtension(filename: string, mimeType: string): string {
    const ext = path.extname(filename);
    if (ext && ext.length <= 5) {
      return ext.toLowerCase();
    }
    switch (mimeType) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/svg+xml':
        return '.svg';
      case 'image/gif':
        return '.gif';
      default:
        return '.png';
    }
  }
}
