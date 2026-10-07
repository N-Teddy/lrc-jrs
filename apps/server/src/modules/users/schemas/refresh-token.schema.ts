import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Document, Types } from 'mongoose';
import {
  BaseDocument,
  baseSchemaOptions,
} from '../../../core/database/base.schema';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema(baseSchemaOptions)
export class RefreshToken extends BaseDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  tokenHash: string; // SHA-256 hash of random 64-char refresh token

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false, index: true })
  isRevoked: boolean;

  @Prop()
  replacedByTokenHash?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Auto-expire documents after expiration
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
