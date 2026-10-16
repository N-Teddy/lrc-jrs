import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { TemplateLoaderUtil } from '../core/utils/template-loader.util';
import type { NotificationStrategy } from './notification.strategy';

@Injectable()
export class EmailService implements OnModuleInit, NotificationStrategy {
  private readonly logger = new Logger(EmailService.name);
  readonly channel = 'email';
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    const host =
      this.configService.get<string>('SMTP_HOST') ||
      (isDev ? 'localhost' : undefined);
    const isMaildev = host === 'localhost' || host === '127.0.0.1';
    const configuredPort = Number(this.configService.get<string>('SMTP_PORT'));
    const port =
      configuredPort && (!isMaildev || configuredPort !== 587)
        ? configuredPort
        : isMaildev
          ? 1025
          : 587;
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      'LRC JRS <noreply@lrcjrs.org>';

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        ignoreTLS: isMaildev,
        auth: user && pass ? { user, pass } : undefined,
        connectionTimeout: 5000,
      });

      if (isMaildev) {
        this.logger.log(
          `📧 [Maildev] Configured SMTP on ${host}:${port} (Webmail UI at http://localhost:1080)`,
        );
      }
    } else {
      this.logger.warn(
        'SMTP_HOST is not configured. Email notifications will be logged to console in stub mode.',
      );
    }
  }

  async onModuleInit() {
    if (this.transporter) {
      try {
        await this.transporter.verify();
        this.logger.log('SMTP connection verified successfully.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `SMTP verification failed: ${msg}. If using Maildev, ensure it is running ("maildev").`,
        );
      }
    }
  }

  async send(recipient: string, message: string, metadata?: Record<string, unknown>): Promise<boolean> {
    return this.sendEmail({
      to: recipient,
      subject: (metadata?.subject as string) || 'Notification - LRC JRS',
      html: message,
    });
  }

  /**
   * Sends an email or stubs to console if SMTP is not configured.
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    if (!this.transporter) {
      this.logger.log(
        `[STUB EMAIL] To: ${options.to} | Subject: ${options.subject}`,
      );
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      this.logger.log(`Email dispatched to ${options.to}`);
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to dispatch email to ${options.to}: ${msg}`);
      return false;
    }
  }

  /**
   * Sends password reset OTP email using the root template: templates/emails/password-reset.hbs
   */
  async sendPasswordResetEmail(
    to: string,
    data: { fullName: string; code: string; expiresInMinutes: number },
  ): Promise<boolean> {
    const html = TemplateLoaderUtil.render('emails/password-reset.hbs', data);

    return this.sendEmail({
      to,
      subject: 'Réinitialisation de votre mot de passe - LRC JRS',
      html,
    });
  }

  /**
   * Sends temporary password email using the root template: templates/emails/temporary-password.hbs
   */
  async sendTemporaryPasswordEmail(
    to: string,
    data: {
      fullName: string;
      tempPassword: string;
      expiresInHours: number;
      loginUrl?: string;
    },
  ): Promise<boolean> {
    const html = TemplateLoaderUtil.render(
      'emails/temporary-password.hbs',
      data,
    );

    return this.sendEmail({
      to,
      subject: 'Bienvenue sur LRC JRS - Vos accès temporaires',
      html,
    });
  }
}
