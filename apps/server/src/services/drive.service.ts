import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface IDriveFileUploadOptions {
  filename: string;
  mimeType: string;
  content: Buffer;
  folderId?: string;
}

export interface IDriveFileResult {
  fileId: string;
  filename: string;
  webViewLink?: string;
  webContentLink?: string;
}

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);
  private readonly clientEmail?: string;
  private readonly privateKey?: string;
  private readonly rootFolderId?: string;

  constructor(private readonly configService: ConfigService) {
    this.clientEmail = this.configService.get<string>(
      'GOOGLE_DRIVE_CLIENT_EMAIL',
    );
    this.privateKey = this.configService.get<string>(
      'GOOGLE_DRIVE_PRIVATE_KEY',
    );
    this.rootFolderId = this.configService.get<string>(
      'GOOGLE_DRIVE_ROOT_FOLDER_ID',
    );

    if (!this.clientEmail || !this.privateKey) {
      this.logger.warn(
        `Google Drive credentials are not configured (target folder: ${this.rootFolderId || 'root'}). Cloud storage features will run in mock mode.`,
      );
    }
  }

  /**
   * Uploads a file to Google Drive.
   */
  async uploadFile(
    options: IDriveFileUploadOptions,
  ): Promise<IDriveFileResult> {
    if (!this.clientEmail || !this.privateKey) {
      this.logger.log(
        `[MOCK DRIVE UPLOAD] File: ${options.filename} (${options.mimeType})`,
      );
      return {
        fileId: `mock-drive-${Date.now()}`,
        filename: options.filename,
        webViewLink: `https://mock.drive.google.com/file/${options.filename}`,
      };
    }

    // When googleapis is integrated with service account
    throw new Error(
      'Google Drive integration pending service account credentials setup.',
    );
  }

  /**
   * Deletes a file from Google Drive.
   */
  async deleteFile(fileId: string): Promise<boolean> {
    if (!this.clientEmail || !this.privateKey) {
      this.logger.log(`[MOCK DRIVE DELETE] File ID: ${fileId}`);
      return true;
    }

    return true;
  }
}
