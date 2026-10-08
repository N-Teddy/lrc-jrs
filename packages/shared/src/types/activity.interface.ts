import type { ActivityType } from '../constants/activity.constant.js';

export interface IActivityReport {
  driveFileId: string;
  driveViewUrl: string;
  driveDownloadUrl?: string;
  fileName: string;
  submittedBy: string;
  submittedAt: string;
  notes?: string;
}

export interface IActivity {
  id: string;
  title: string;
  description?: string;
  activityType: ActivityType;
  date: string;
  location: string;
  isGlobal: boolean;
  townIds: string[];
  hostTownId: string;
  createdBy: string;
  report?: IActivityReport;
  createdAt?: string;
  updatedAt?: string;
}
