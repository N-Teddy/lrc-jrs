import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Town, TownSchema } from '../../database/schemas';
import { TownsController } from './towns.controller';
import { TownsService } from './towns.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Town.name, schema: TownSchema }]),
  ],
  controllers: [TownsController],
  providers: [TownsService],
  exports: [MongooseModule, TownsService],
})
export class TownsModule {}
