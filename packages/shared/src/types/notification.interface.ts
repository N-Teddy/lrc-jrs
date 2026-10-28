import type { UserRole } from '../constants/roles.constant.js';

export type NotificationLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export type NotificationAction =
  | 'ACTIVITY_CREATED'
  | 'ACTIVITY_UPDATED'
  | 'ACTIVITY_RESCHEDULED'
  | 'ACTIVITY_LOCATION_CHANGED'
  | 'ACTIVITY_CANCELLED'
  | 'ACTIVITY_REOPENED'
  | 'ACTIVITY_COMPLETED'
  | 'ACTIVITY_DELETED'
  | 'ACTIVITY_REMINDER_2_WEEKS'
  | 'ACTIVITY_REMINDER_1_WEEK'
  | 'ACTIVITY_REMINDER_PARTICIPATING'
  | 'REPORT_UPLOAD_WARNING'
  | 'MONTHLY_ACTIVITIES_DIGEST'
  | 'ATTENDANCE_RECORDED'
  | 'ATTENDANCE_LOCKED'
  | 'ATTENDANCE_UNLOCKED'
  | 'REPORT_UPLOADED'
  | 'REPORT_DELETED'
  | 'DRIVE_FILE_UPLOADED'
  | 'DRIVE_FILE_DELETED'
  | 'MEMBER_REGISTERED'
  | 'MEMBER_UPDATED'
  | 'MEMBER_DELETED'
  | 'MEMBER_INTAKE_SUBMITTED'
  | 'MEMBER_INTAKE_APPROVED'
  | 'MEMBER_INTAKE_REJECTED'
  | 'TOWN_TRANSFER'
  | 'ACCESS_GRANTED'
  | 'ACCESS_REVOKED'
  | 'ROLE_CHANGED'
  | 'TOWN_SCOPE_UPDATED'
  | 'PASSWORD_CHANGED'
  | 'SYSTEM_ANNOUNCEMENT';

export type NotificationResourceType =
  | 'ACTIVITY'
  | 'MEMBER'
  | 'TOWN_TRANSFER'
  | 'ATTENDANCE'
  | 'ACCESS'
  | 'INTAKE'
  | 'REPORT'
  | 'DRIVE_FILE'
  | 'SYSTEM';

export type NotificationPlatform = 'ios' | 'android' | 'desktop';

export interface NotificationResource {
  entityType: NotificationResourceType;
  entityId?: string;
  townId?: string;
  subTab?: string;
  metadata?: Record<string, unknown>;
}

export interface INotification {
  _id: string;
  recipientId: string;
  townId?: string;
  level: NotificationLevel;
  action?: NotificationAction;
  titleKey: string;
  titleParams?: Record<string, string | number>;
  bodyKey: string;
  bodyParams?: Record<string, string | number>;
  resource?: NotificationResource;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationTarget {
  userIds?: string[];
  roles?: UserRole[];
  townId?: string;
  townIds?: string[];
  global?: boolean;
  excludeUserIds?: string[];
}

export interface IPushToken {
  token: string;
  platform: NotificationPlatform;
  deviceName?: string;
  updatedAt: string;
}

export interface CreateNotificationDto {
  target: NotificationTarget;
  level: NotificationLevel;
  action?: NotificationAction;
  titleKey: string;
  titleParams?: Record<string, string | number>;
  bodyKey: string;
  bodyParams?: Record<string, string | number>;
  resource?: NotificationResource;
  sendPush?: boolean;
}

export interface NotificationQueryDto {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface NotificationStatsDto {
  unreadCount: number;
}

export interface RegisterPushTokenDto {
  token: string;
  platform: NotificationPlatform;
  deviceName?: string;
}
