import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Document, Types } from 'mongoose';
import {
  BaseDocument,
  baseSchemaOptions,
} from '../../core/database/base.schema';

export type RegistrationLinkDocument = RegistrationLink & Document;

@Schema(baseSchemaOptions)
export class RegistrationLink extends BaseDocument {
  @Prop({ required: true, unique: true, index: true, trim: true })
  token: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Town', required: true, index: true })
  homeTownId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true, index: true })
  expiresAt: Date;

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  usageCount: number;

  @Prop({ type: Number, default: null })
  maxUses?: number | null;

  @Prop({ type: String, trim: true })
  customMessage?: string;
}

export const RegistrationLinkSchema =
  SchemaFactory.createForClass(RegistrationLink);
RegistrationLinkSchema.index({ homeTownId: 1, isActive: 1, expiresAt: 1 });
