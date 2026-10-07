import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { databaseConfig } from '../../config/database.config';
import { DatabaseModule } from '../../core/database/database.module';
import { Town, TownSchema, User, UserSchema } from '../schemas';
import { SeedService } from './seed.service';
import { TownsSeeder } from './seeders/towns.seeder';
import { UsersSeeder } from './seeders/users.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: ['.env', 'apps/server/.env'],
    }),
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Town.name, schema: TownSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [TownsSeeder, UsersSeeder, SeedService],
  exports: [SeedService],
})
export class SeedModule {}
