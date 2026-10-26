import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { Document } from 'mongoose';
import {
  BaseDocument,
  baseSchemaOptions,
} from '../../core/database/base.schema';

export type NotificationDocument = Notification & Document;

@Schema({ _id: false })
export class NotificationResourceSchema {
  @Prop({ required: true })
  entityType: string;

  @Prop()
  entityId?: string;

  @Prop()
  townId?: string;

  @Prop()
  subTab?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

@Schema({
  ...baseSchemaOptions,
  collection: 'notifications',
})
export class Notification extends BaseDocument {
  @Prop({ required: true, index: true })
  recipientId: string;

  @Prop({ index: true })
  townId?: string;

  @Prop({
    required: true,
    enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'],
    default: 'INFO',
  })
  level: string;

  @Prop()
  action?: string;

  @Prop({ required: true })
  titleKey: string;

  @Prop({ type: Object })
  titleParams?: Record<string, string | number>;

  @Prop({ required: true })
  bodyKey: string;

  @Prop({ type: Object })
  bodyParams?: Record<string, string | number>;

  @Prop({ type: NotificationResourceSchema })
  resource?: NotificationResourceSchema;

  @Prop({ required: true, default: false, index: true })
  read: boolean;

  @Prop({ type: Date })
  readAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
