import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DriveService } from './drive.service';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [WhatsAppService, EmailService, DriveService],
  exports: [WhatsAppService, EmailService, DriveService],
})
export class ServicesModule {}
