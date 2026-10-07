import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Document } from 'mongoose';
import {
  BaseDocument,
  baseSchemaOptions,
} from '../../core/database/base.schema';

export type TownDocument = Town & Document;

@Schema(baseSchemaOptions)
export class Town extends BaseDocument {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({
    required: true,
    trim: true,
    uppercase: true,
    unique: true,
    index: true,
  })
  code: string;

  @Prop({ default: 0 })
  activePcCount: number;
}

export const TownSchema = SchemaFactory.createForClass(Town);
