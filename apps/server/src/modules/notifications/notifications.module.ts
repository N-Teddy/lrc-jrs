import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from '../../database/schemas/notification.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './push-notification.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('jwt.secret') ||
          configService.get<string>('JWT_SECRET') ||
          'default_secret',
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') ||
            configService.get<string>('JWT_EXPIRATION') ||
            '7d') as never,
        },
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsGateway,
    NotificationsService,
    PushNotificationService,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
