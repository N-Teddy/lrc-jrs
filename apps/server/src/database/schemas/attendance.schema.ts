import { AttendanceStatus, AttendeeType } from '@jrs/shared';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Document, Schema as MongooseSchema, Types } from 'mongoose';
import {
  BaseDocument,
  baseSchemaOptions,
} from '../../core/database/base.schema';

export type AttendanceDocument = Attendance & Document;

@Schema({ _id: false })
export class GuestInfo {
  @Prop({ type: String, required: true, trim: true })
  fullName: string;

  @Prop({ type: String, trim: true })
  phoneNumber?: string;

  @Prop({ type: String, trim: true })
  notes?: string;
}

export const GuestInfoSchema = SchemaFactory.createForClass(GuestInfo);

@Schema({ _id: true })
export class AttendanceItem {
  @Prop({
    type: String,
    required: true,
    enum: Object.values(AttendeeType),
  })
  attendeeType: AttendeeType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  memberId?: Types.ObjectId;

  @Prop({ type: GuestInfoSchema })
  guestInfo?: GuestInfo;

  @Prop({ type: Date, default: Date.now })
  checkInTime: Date;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(AttendanceStatus),
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;
}

export const AttendanceItemSchema =
  SchemaFactory.createForClass(AttendanceItem);

@Schema(baseSchemaOptions)
export class Attendance extends BaseDocument {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Activity',
    required: true,
    unique: true,
    index: true,
  })
  activityId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  recordedBy: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  recordedAt: Date;

  @Prop({ default: false, index: true })
  isLocked: boolean;

  @Prop({ type: Date })
  lockedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  lockedBy?: Types.ObjectId;

  @Prop({ type: String })
  lockReason?: string;

  @Prop({ type: [AttendanceItemSchema], default: [] })
  attendees: AttendanceItem[];
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
