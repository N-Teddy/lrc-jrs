import type { ActivityType } from '../constants/activity.constant.js';

export interface IChecklistItem {
  id: string;
  labelKey: string;
  labelFr: string;
  labelEn: string;
  isRequired: boolean;
}

export interface IActivityReminderTemplate {
  id?: string;
  activityType: ActivityType;
  items: IChecklistItem[];
  customInstructionsFr?: string;
  customInstructionsEn?: string;
  updatedAt?: string;
}
