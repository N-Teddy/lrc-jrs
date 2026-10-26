import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PhoneSanitizer } from '../core/utils/phone-sanitizer.util';
import { TemplateLoaderUtil } from '../core/utils/template-loader.util';
import type { NotificationStrategy } from './notification.strategy';
import type {
  IJiFiContactResponse,
  IJiFiSendMessageResponse,
} from './whatsapp.types';

@Injectable()
export class WhatsAppService implements NotificationStrategy {
  private readonly logger = new Logger(WhatsAppService.name);
  readonly channel = 'whatsapp';
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService
      .getOrThrow<string>('WHATSAPP_API_BASE_URL')
      .trim()
      .replace(/\/+$/, '');
    const rawKey = this.configService
      .getOrThrow<string>('WHATSAPP_API_KEY')
      .trim()
      .replace(/^["']|["']$/g, '');
    this.apiKey = rawKey.startsWith('Bearer ')
      ? rawKey.slice(7).trim()
      : rawKey;
  }

  /**
   * Checks if a phone number supports WhatsApp via JiFi Hub.
   * Endpoint: GET /contacts/{number}
   */
  async checkContact(phoneNumber: string): Promise<boolean> {
    const sanitized = PhoneSanitizer.toInternationalDigits(phoneNumber);
    if (!sanitized) return false;

    try {
      const response = await axios.get<IJiFiContactResponse>(
        `${this.baseUrl}/contacts/${sanitized}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'application/json, text/plain, */*',
          },
          timeout: 10000,
        },
      );

      return response.data?.data?.exists === true;
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.warn(
        `Failed to verify WhatsApp contact ${sanitized}: ${err.message || 'Unknown error'}`,
      );
      return false;
    }
  }

  async send(
    recipient: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<boolean> {
    return this.sendTextMessage(recipient, message);
  }

  /**
   * Sends a raw text message to a WhatsApp contact via JiFi Hub.
   * Endpoint: POST /messages/text
   */
  async sendTextMessage(to: string, text: string): Promise<boolean> {
    const sanitized = PhoneSanitizer.toInternationalDigits(to);
    if (!sanitized) {
      this.logger.error(
        'Cannot send WhatsApp message: empty destination number',
      );
      return false;
    }

    try {
      const response = await axios.post<IJiFiSendMessageResponse>(
        `${this.baseUrl}/messages/text`,
        {
          to: sanitized,
          text,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'application/json, text/plain, */*',
          },
          timeout: 10000,
        },
      );

      const isSuccess = response.data?.success === true;
      if (isSuccess) {
        this.logger.log(
          `WhatsApp message dispatched to ${PhoneSanitizer.maskPhoneNumber(sanitized)}`,
        );
      } else {
        this.logger.warn(
          `WhatsApp dispatch returned failure: ${JSON.stringify(response.data)}`,
        );
      }

      return isSuccess;
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { data?: unknown; status?: number };
      };
      let responseDetails = '';
      if (
        typeof err.response?.data === 'string' &&
        err.response.data.includes('<html')
      ) {
        responseDetails =
          ' (Blocked by Cloudflare Bot Protection / Managed Challenge on dash.jifihub.com)';
      } else if (err.response?.data) {
        responseDetails = ` (Details: ${JSON.stringify(err.response.data)})`;
      }
      this.logger.error(
        `Error dispatching WhatsApp to ${sanitized}: ${err.message || 'Unknown error'}${responseDetails}`,
      );
      return false;
    }
  }

  /**
   * Sends a password reset OTP code using the root template: templates/whatsapp/password-reset.txt
   */
  async sendPasswordResetMessage(
    to: string,
    data: { fullName: string; code: string; expiresInMinutes: number },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    metadata?: Record<string, unknown>,
  ): Promise<boolean> {
    const message = TemplateLoaderUtil.render(
      'whatsapp/password-reset.txt',
      data,
    );
    return this.sendTextMessage(to, message);
  }

  /**
   * Sends a temporary password notification using the root template: templates/whatsapp/temporary-password.txt
   */
  async sendTemporaryPasswordMessage(
    to: string,
    data: { fullName: string; tempPassword: string; expiresInHours: number },
  ): Promise<boolean> {
    const message = TemplateLoaderUtil.render(
      'whatsapp/temporary-password.txt',
      data,
    );
    return this.sendTextMessage(to, message);
  }
}
