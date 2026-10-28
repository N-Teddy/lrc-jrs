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
  MUST_CHANGE_PASSWORD = `MUST_CHANGE_PASSWORD`,
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

export enum IntakeStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ _id: false })
class UserAccountInfo {
  @Prop({
    type: String,
    required: true,
    enum: AccountStatus,
    default: AccountStatus.PENDING_ACTIVATION,
  })
  status: AccountStatus;

  @Prop({ type: Boolean, default: true })
  hasAppAccess: boolean;

  @Prop({ type: Boolean, default: false })
  isAccessRevoked: boolean;

  @Prop({ type: [String], default: [] })
  allowedReadTownIds: string[];

  @Prop({ type: String })
  invitedBy?: string;

  @Prop({ type: Date })
  invitedAt?: Date;
}

@Schema({ _id: false })
export class UserPushToken {
  @Prop({ required: true })
  token: string;

  @Prop({ required: true, enum: ['ios', 'android', 'desktop'] })
  platform: 'ios' | 'android' | 'desktop';

  @Prop({ type: String })
  deviceName?: string;

  @Prop({ type: Date, default: () => new Date() })
  updatedAt: Date;
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

  @Prop({ type: String })
  reason?: string;
}

@Schema(baseSchemaOptions)
export class User extends BaseDocument {
  @Prop({ type: String, required: true, trim: true })
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

  @Prop({ type: String, trim: true })
  avatarUrl?: string;

  @Prop({ type: String, enum: ['MALE', 'FEMALE'], required: false })
  gender?: 'MALE' | 'FEMALE';

  @Prop({ type: Boolean, default: false })
  isWhatsappVerified?: boolean;

  @Prop({ type: String })
  integrationDate?: string;

  @Prop({ type: String })
  passwordHash?: string;

  @Prop({ type: String })
  tempPasswordHash?: string;

  @Prop({ type: Date })
  tempPasswordExpiresAt?: Date;

  @Prop({ type: Boolean, default: false })
  isTemporaryPassword: boolean;

  @Prop({ type: Date })
  lastLogoutAt?: Date;

  @Prop({ required: true })
  dateOfBirth: string;

  @Prop({ type: Boolean, default: true })
  isJr: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Town', required: true, index: true })
  homeTownId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: UserRole,
    default: UserRole.MEMBER,
    index: true,
  })
  role: UserRole;

  @Prop({ type: Boolean, default: false, index: true })
  isActivePC: boolean;

  @Prop({ type: UserAccountInfo, default: () => ({}) })
  account: UserAccountInfo;

  @Prop({ type: [TownTransferRecord], default: [] })
  transferHistory: TownTransferRecord[];

  @Prop({
    type: String,
    enum: IntakeStatus,
    default: IntakeStatus.APPROVED,
    index: true,
  })
  intakeStatus: IntakeStatus;

  @Prop({ type: Types.ObjectId, ref: 'RegistrationLink', index: true })
  registrationLinkId?: Types.ObjectId;

  @Prop({ type: String, trim: true })
  intakeNote?: string;

  @Prop({ type: String, enum: ['fr', 'en'], default: 'fr' })
  preferredLanguage: 'fr' | 'en';

  @Prop({ type: [UserPushToken], default: [] })
  pushTokens: UserPushToken[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ homeTownId: 1, role: 1 });
UserSchema.index({ homeTownId: 1, isActivePC: 1 });
UserSchema.index({ 'account.hasAppAccess': 1 });
UserSchema.index({ 'transferHistory.fromTownId': 1 });
UserSchema.index({ 'transferHistory.toTownId': 1 });
UserSchema.index({ 'transferHistory.transferredAt': -1 });
