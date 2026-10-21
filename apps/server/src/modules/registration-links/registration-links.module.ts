import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RegistrationLink,
  RegistrationLinkSchema,
  Town,
  TownSchema,
  User,
  UserSchema,
} from '../../database/schemas';
import { PublicRegistrationController } from './public-registration.controller';
import { RegistrationLinksController } from './registration-links.controller';
import { RegistrationLinksService } from './registration-links.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RegistrationLink.name, schema: RegistrationLinkSchema },
      { name: User.name, schema: UserSchema },
      { name: Town.name, schema: TownSchema },
    ]),
  ],
  controllers: [RegistrationLinksController, PublicRegistrationController],
  providers: [RegistrationLinksService],
  exports: [RegistrationLinksService],
})
export class RegistrationLinksModule {}
