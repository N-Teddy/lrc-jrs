import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Document, Types } from 'mongoose';
import {
  BaseDocument,
  baseSchemaOptions,
} from '../../core/database/base.schema';

export type PasswordResetTokenDocument = PasswordResetToken & Document;

@Schema(baseSchemaOptions)
export class PasswordResetToken extends BaseDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  codeHash: string; // bcrypt hash of 6-digit OTP

  @Prop({ required: true, default: 0 })
  attempts: number;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ index: true })
  resetToken?: string; // High-entropy 64-char token issued upon code verification

  @Prop()
  resetTokenExpiresAt?: Date;

  @Prop({ default: false })
  used: boolean;
}

export const PasswordResetTokenSchema =
  SchemaFactory.createForClass(PasswordResetToken);

// Auto-expire documents after expiration
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });
