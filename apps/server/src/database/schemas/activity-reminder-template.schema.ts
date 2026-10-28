import { ActivityType } from '@jrs/shared';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Document } from 'mongoose';
import {
  BaseDocument,
  baseSchemaOptions,
} from '../../core/database/base.schema';

export type ActivityReminderTemplateDocument = ActivityReminderTemplate &
  Document;

@Schema({ _id: false })
export class ChecklistItem {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true })
  labelKey: string;

  @Prop({ type: String, required: true })
  labelFr: string;

  @Prop({ type: String, required: true })
  labelEn: string;

  @Prop({ type: Boolean, default: true })
  isRequired: boolean;
}

export const ChecklistItemSchema = SchemaFactory.createForClass(ChecklistItem);

@Schema(baseSchemaOptions)
export class ActivityReminderTemplate extends BaseDocument {
  @Prop({
    type: String,
    required: true,
    unique: true,
    enum: Object.values(ActivityType),
    index: true,
  })
  activityType: ActivityType;

  @Prop({ type: [ChecklistItemSchema], default: [] })
  items: ChecklistItem[];

  @Prop({ type: String })
  customInstructionsFr?: string;

  @Prop({ type: String })
  customInstructionsEn?: string;
}

export const ActivityReminderTemplateSchema = SchemaFactory.createForClass(
  ActivityReminderTemplate,
);
