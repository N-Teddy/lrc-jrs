import { ActivityStatus, ActivityType } from '@jrs/shared';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Document, Schema as MongooseSchema, Types } from 'mongoose';
import {
  BaseDocument,
  baseSchemaOptions,
} from '../../core/database/base.schema';

export type ActivityDocument = Activity & Document;

@Schema({ _id: false })
class ActivityChangeLog {
  @Prop({
    type: String,
    required: true,
    enum: ['RESCHEDULED', 'LOCATION_CHANGED', 'STATUS_CHANGED'],
  })
  changeType: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  changedBy: Types.ObjectId;

  @Prop({ type: String, required: true })
  changedByName: string;

  @Prop({ type: Date, default: Date.now })
  changedAt: Date;

  @Prop({ type: Object, default: {} })
  previousValues: Record<string, any>;

  @Prop({ type: Object, default: {} })
  newValues: Record<string, any>;

  @Prop({ type: String })
  reason?: string;
}

const ActivityChangeLogSchema = SchemaFactory.createForClass(ActivityChangeLog);

@Schema({ _id: false })
class ActivityReport {
  @Prop({ type: String, required: true })
  fileId: string;

  @Prop({ type: String, required: true })
  filename: string;

  @Prop({ type: String })
  webViewLink?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ type: String })
  uploadedByName?: string;

  @Prop({ type: Date, default: Date.now })
  uploadedAt: Date;

  @Prop({ type: String })
  summary?: string;

  @Prop({ type: String })
  folderId?: string;

  @Prop({ type: Number })
  fileSize?: number;
}

const ActivityReportSchema = SchemaFactory.createForClass(ActivityReport);

@Schema(baseSchemaOptions)
export class Activity extends BaseDocument {
  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(ActivityType),
    index: true,
  })
  activityType: ActivityType;

  @Prop({ type: Date, required: true, index: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Town',
    required: true,
    index: true,
  })
  townId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  locationVenue: string;

  @Prop({ type: String, trim: true })
  notes?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Town',
    required: true,
    index: true,
  })
  hostTownId: Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Town' }],
    default: [],
    index: true,
  })
  includedTownIds: Types.ObjectId[];

  @Prop({
    type: String,
    required: true,
    enum: Object.values(ActivityStatus),
    default: ActivityStatus.SCHEDULED,
    index: true,
  })
  status: ActivityStatus;

  @Prop({ type: [ActivityChangeLogSchema], default: [] })
  changeHistory: ActivityChangeLog[];

  @Prop({ type: Boolean, default: false, index: true })
  isAttendanceLocked: boolean;

  @Prop({ type: Date })
  attendanceLockedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  attendanceLockedBy?: Types.ObjectId;

  @Prop({ type: String })
  attendanceLockedByName?: string;

  @Prop({ type: ActivityReportSchema })
  report?: ActivityReport;

  @Prop({ type: [ActivityReportSchema], default: [] })
  reports: ActivityReport[];

  @Prop({ type: [String], default: [] })
  remindersSent: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted: boolean;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Compound indexes for performant monthly, reminder, and report queries per town
ActivitySchema.index({ hostTownId: 1, startDate: 1, isDeleted: 1 });
ActivitySchema.index({ townId: 1, startDate: 1, isDeleted: 1 });
ActivitySchema.index({ includedTownIds: 1, startDate: 1, isDeleted: 1 });
ActivitySchema.index({ isDeleted: 1, status: 1, startDate: 1 });
ActivitySchema.index({ isDeleted: 1, endDate: 1, 'report.fileId': 1 });
