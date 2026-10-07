import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Town, TownSchema } from '../../database/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Town.name, schema: TownSchema }]),
  ],
  exports: [MongooseModule],
})
export class TownsModule {}
