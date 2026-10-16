import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';
import type { NotificationStrategy } from './notification.strategy';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private strategies: Map<string, NotificationStrategy> = new Map();

  constructor(
    private readonly emailService: EmailService,
    private readonly whatsappService: WhatsAppService,
  ) {
    this.strategies.set(this.emailService.channel, this.emailService);
    this.strategies.set(this.whatsappService.channel, this.whatsappService);
  }

  async sendNotification(
    preferredChannel: 'whatsapp' | 'email',
    recipient: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    let strategy = this.strategies.get(preferredChannel);

    if (!strategy) {
      this.logger.warn(`Strategy for channel ${preferredChannel} not found. Falling back to email.`);
      strategy = this.strategies.get('email');
    }

    if (!strategy) {
      this.logger.error('No valid notification strategy found.');
      return false;
    }

    let success = await strategy.send(recipient, message, metadata);

    if (!success && preferredChannel !== 'email') {
      this.logger.log(`Failed to send via ${preferredChannel}. Falling back to email.`);
      const fallbackStrategy = this.strategies.get('email');
      if (fallbackStrategy) {
        success = await fallbackStrategy.send(recipient, message, metadata);
      }
    }

    return success;
  }
}
