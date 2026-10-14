import { ActivityStatus, ActivityType } from '@jrs/shared';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Document, Schema as MongooseSchema, Types } from 'mongoose';
import {
  BaseDocument,
  baseSchemaOptions,
} from '../../core/database/base.schema';

export type ActivityDocument = Activity & Document;

@Schema({ _id: false })
export class ActivityChangeLog {
  @Prop({
    required: true,
    enum: ['RESCHEDULED', 'LOCATION_CHANGED', 'STATUS_CHANGED'],
  })
  changeType: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  changedBy: Types.ObjectId;

  @Prop({ required: true })
  changedByName: string;

  @Prop({ default: Date.now })
  changedAt: Date;

  @Prop({ type: Object, default: {} })
  previousValues: Record<string, any>;

  @Prop({ type: Object, default: {} })
  newValues: Record<string, any>;

  @Prop({ type: String })
  reason?: string;
}

export const ActivityChangeLogSchema =
  SchemaFactory.createForClass(ActivityChangeLog);

@Schema({ _id: false })
export class ActivityReport {
  @Prop({ required: true })
  fileId: string;

  @Prop({ required: true })
  filename: string;

  @Prop()
  webViewLink?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop()
  uploadedByName?: string;

  @Prop({ default: Date.now })
  uploadedAt: Date;

  @Prop()
  summary?: string;

  @Prop()
  folderId?: string;

  @Prop()
  fileSize?: number;
}

export const ActivityReportSchema =
  SchemaFactory.createForClass(ActivityReport);

@Schema(baseSchemaOptions)
export class Activity extends BaseDocument {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({
    required: true,
    enum: Object.values(ActivityType),
    index: true,
  })
  activityType: ActivityType;

  @Prop({ required: true, index: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Town',
    required: true,
    index: true,
  })
  townId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  locationVenue: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Town',
    required: true,
    index: true,
  })
  hostTownId: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(ActivityStatus),
    default: ActivityStatus.SCHEDULED,
    index: true,
  })
  status: ActivityStatus;

  @Prop({ type: [ActivityChangeLogSchema], default: [] })
  changeHistory: ActivityChangeLog[];

  @Prop({ default: false, index: true })
  isAttendanceLocked: boolean;

  @Prop()
  attendanceLockedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  attendanceLockedBy?: Types.ObjectId;

  @Prop()
  attendanceLockedByName?: string;

  @Prop({ type: ActivityReportSchema })
  report?: ActivityReport;

  @Prop({ type: [ActivityReportSchema], default: [] })
  reports: ActivityReport[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: false, index: true })
  isDeleted: boolean;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Compound indexes for performant monthly & yearly queries per town
ActivitySchema.index({ hostTownId: 1, startDate: 1, isDeleted: 1 });
ActivitySchema.index({ townId: 1, startDate: 1, isDeleted: 1 });
