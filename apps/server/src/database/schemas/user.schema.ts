import { UserRole } from '@jrs/shared';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Document, Types } from 'mongoose';
import {
  BaseDocument,
  baseSchemaOptions,
} from '../../core/database/base.schema';

export type UserDocument = User & Document;

export enum AccountStatus {
  PENDING_ACTIVATION = 'PENDING_ACTIVATION',
  MUST_CHANGE_PASSWORD = 'MUST_CHANGE_PASSWORD',
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

@Schema({ _id: false })
export class UserAccountInfo {
  @Prop({
    required: true,
    enum: AccountStatus,
    default: AccountStatus.PENDING_ACTIVATION,
  })
  status: AccountStatus;

  @Prop({ default: true })
  hasAppAccess: boolean;

  @Prop({ default: false })
  isAccessRevoked: boolean;

  @Prop({ type: [String], default: [] })
  allowedReadTownIds: string[];

  @Prop()
  invitedBy?: string;

  @Prop()
  invitedAt?: Date;
}

@Schema({ _id: false })
export class TownTransferRecord {
  @Prop({ required: true })
  fromTownId: string;

  @Prop({ required: true })
  toTownId: string;

  @Prop({ required: true, default: () => new Date().toISOString() })
  transferredAt: string;

  @Prop({ required: true })
  transferredBy: string;

  @Prop()
  reason?: string;
}

@Schema(baseSchemaOptions)
export class User extends BaseDocument {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  phoneNumber: string;

  @Prop({
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  email?: string;

  @Prop({ trim: true })
  avatarUrl?: string;

  @Prop({ type: String, enum: ['MALE', 'FEMALE'], required: false })
  gender?: 'MALE' | 'FEMALE';

  @Prop()
  passwordHash?: string;

  @Prop()
  tempPasswordHash?: string;

  @Prop()
  tempPasswordExpiresAt?: Date;

  @Prop({ default: false })
  isTemporaryPassword: boolean;

  @Prop({ required: true })
  dateOfBirth: string;

  @Prop({ default: true })
  isJr: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Town', required: true, index: true })
  homeTownId: Types.ObjectId;

  @Prop({
    required: true,
    enum: UserRole,
    default: UserRole.MEMBER,
    index: true,
  })
  role: UserRole;

  @Prop({ default: false, index: true })
  isActivePC: boolean;

  @Prop({ type: UserAccountInfo, default: () => ({}) })
  account: UserAccountInfo;

  @Prop({ type: [TownTransferRecord], default: [] })
  transferHistory: TownTransferRecord[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ homeTownId: 1, role: 1 });
UserSchema.index({ homeTownId: 1, isActivePC: 1 });
