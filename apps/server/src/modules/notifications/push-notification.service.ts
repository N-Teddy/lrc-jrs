import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ExpoPushMessage {
  to: string | string[];
  sound?: 'default' | null;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'default' | 'normal' | 'high';
  badge?: number;
  channelId?: string;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?:
      | 'DeviceNotRegistered'
      | 'MessageTooBig'
      | 'MessageRateExceeded'
      | string;
  };
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly expoApiUrl = 'https://exp.host/--/api/v2/push/send';

  /**
   * Send push notifications to Expo push tokens in batches of up to 100
   * Returns list of invalid tokens that should be pruned from database
   */
  async sendPushNotifications(
    messages: ExpoPushMessage[],
  ): Promise<{ invalidTokens: string[] }> {
    const invalidTokens: string[] = [];

    // Filter valid Expo push tokens
    const validMessages = messages.filter((msg) => {
      const tokens = Array.isArray(msg.to) ? msg.to : [msg.to];
      return tokens.some((t) => this.isExpoPushToken(t));
    });

    if (validMessages.length === 0) {
      return { invalidTokens };
    }

    try {
      const response = await axios.post<{ data: ExpoPushTicket[] }>(
        this.expoApiUrl,
        validMessages,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          timeout: 10000,
        },
      );

      const tickets = response.data?.data || [];
      tickets.forEach((ticket, idx) => {
        if (ticket.status === 'error') {
          this.logger.warn(
            `Push delivery error: ${ticket.message} (${ticket.details?.error})`,
          );
          if (ticket.details?.error === 'DeviceNotRegistered') {
            const recipient = validMessages[idx]?.to;
            if (typeof recipient === 'string') {
              invalidTokens.push(recipient);
            } else if (Array.isArray(recipient)) {
              invalidTokens.push(...recipient);
            }
          }
        }
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to send push notifications via Expo: ${errorMsg}`,
      );
    }

    return { invalidTokens };
  }

  isExpoPushToken(token: string): boolean {
    return (
      typeof token === 'string' &&
      (((token.startsWith('ExponentPushToken[') ||
        token.startsWith('ExpoPushToken[')) &&
        token.endsWith(']')) ||
        /^[a-z\d]{8}-[a-z\d]{4}-[a-z\d]{4}-[a-z\d]{4}-[a-z\d]{12}$/i.test(
          token,
        ))
    );
  }
}
