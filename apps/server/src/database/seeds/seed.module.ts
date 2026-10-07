import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { appConfig } from '../../config/app.config';
import { databaseConfig } from '../../config/database.config';
import { DatabaseModule } from '../../core/database/database.module';
import { TownsModule } from '../../modules/towns/towns.module';
import { UsersModule } from '../../modules/users/users.module';
import { ServicesModule } from '../../services/services.module';
import { Town, TownSchema } from '../schemas';
import { SeedService } from './seed.service';
import { TownsSeeder } from './seeders/towns.seeder';
import { UsersSeeder } from './seeders/users.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env', 'apps/server/.env'],
    }),
    DatabaseModule,
    ServicesModule,
    TownsModule,
    UsersModule,
    MongooseModule.forFeature([{ name: Town.name, schema: TownSchema }]),
  ],
  providers: [TownsSeeder, UsersSeeder, SeedService],
  exports: [SeedService],
})
export class SeedModule {}
