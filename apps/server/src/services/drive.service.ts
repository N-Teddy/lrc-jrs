import crypto from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

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

  private cachedAccessToken?: string;
  private tokenExpiresAt = 0;

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
   * Generates a Google OAuth2 Access Token using the Service Account Private Key and RS256 JWT
   */
  private async getAccessToken(): Promise<string | null> {
    if (!this.clientEmail || !this.privateKey) return null;

    const now = Math.floor(Date.now() / 1000);
    if (this.cachedAccessToken && this.tokenExpiresAt > now + 60) {
      return this.cachedAccessToken;
    }

    try {
      const formattedPrivateKey = this.privateKey.includes('\\n')
        ? this.privateKey.replace(/\\n/g, '\n')
        : this.privateKey;

      const header = {
        alg: 'RS256',
        typ: 'JWT',
      };

      const claimSet = {
        iss: this.clientEmail,
        scope: 'https://www.googleapis.com/auth/drive',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      };

      const base64UrlEncode = (obj: object) =>
        Buffer.from(JSON.stringify(obj))
          .toString('base64')
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');

      const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(claimSet)}`;

      const sign = crypto.createSign('RSA-SHA256');
      sign.update(unsignedToken);
      const signature = sign
        .sign(formattedPrivateKey, 'base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const jwt = `${unsignedToken}.${signature}`;

      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.cachedAccessToken = response.data.access_token;
      this.tokenExpiresAt = now + (response.data.expires_in || 3600);
      return this.cachedAccessToken || null;
    } catch (err: any) {
      this.logger.error(
        `Failed to obtain Google Drive access token: ${err.response?.data?.error_description || err.message}`,
      );
      return null;
    }
  }

  /**
   * Uploads a file to Google Drive using multipart upload
   */
  async uploadFile(
    options: IDriveFileUploadOptions,
  ): Promise<IDriveFileResult> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      this.logger.log(
        `[MOCK DRIVE UPLOAD] File: ${options.filename} (${options.mimeType})`,
      );
      return {
        fileId: `mock-drive-${Date.now()}`,
        filename: options.filename,
        webViewLink: `https://mock.drive.google.com/file/${encodeURIComponent(options.filename)}`,
      };
    }

    const folderId = options.folderId || this.rootFolderId;
    const boundary = `-------314159265358979323846_${Date.now()}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: options.filename,
      parents: folderId ? [folderId] : undefined,
    };

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`,
      ),
      Buffer.from(
        `${delimiter}Content-Type: ${options.mimeType || 'application/octet-stream'}\r\nContent-Transfer-Encoding: base64\r\n\r\n`,
      ),
      Buffer.from(options.content.toString('base64')),
      Buffer.from(closeDelimiter),
    ]);

    const uploadRes = await axios.post(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
      multipartRequestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
      },
    );

    const file = uploadRes.data;

    // Best-effort permission set to allow viewing by anyone with the link
    try {
      await axios.post(
        `https://www.googleapis.com/drive/v3/files/${file.id}/permissions`,
        { role: 'reader', type: 'anyone' },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    } catch {
      // Permission create is best effort
    }

    return {
      fileId: file.id,
      filename: file.name || options.filename,
      webViewLink:
        file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      webContentLink: file.webContentLink,
    };
  }

  /**
   * Deletes a file from Google Drive
   */
  async deleteFile(fileId: string): Promise<boolean> {
    if (fileId.startsWith('mock-drive-')) {
      this.logger.log(`[MOCK DRIVE DELETE] File ID: ${fileId}`);
      return true;
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      return true;
    }

    try {
      await axios.delete(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      return true;
    } catch (err: any) {
      this.logger.error(
        `Failed to delete Google Drive file ${fileId}: ${err.message}`,
      );
      return false;
    }
  }
}
