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
    this.baseUrl = this.configService.getOrThrow<string>(
      'WHATSAPP_API_BASE_URL',
    );
    this.apiKey = this.configService.getOrThrow<string>('WHATSAPP_API_KEY');
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
      const err = error as { message?: string };
      this.logger.error(
        `Error dispatching WhatsApp to ${sanitized}: ${err.message || 'Unknown error'}`,
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
