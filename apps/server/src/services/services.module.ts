import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DriveService } from './drive.service';
import { EmailService } from './email.service';
import { MediaService } from './media.service';
import { WhatsAppService } from './whatsapp.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [WhatsAppService, EmailService, DriveService, MediaService],
  exports: [WhatsAppService, EmailService, DriveService, MediaService],
})
export class ServicesModule {}
