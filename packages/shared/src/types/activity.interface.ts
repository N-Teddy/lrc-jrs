import type {
  ActivityStatus,
  ActivityType,
} from '../constants/activity.constant.js';
import type { ITown } from './town.interface.js';

export interface IActivityChangeLog {
  id: string;
  changeType: 'RESCHEDULED' | 'LOCATION_CHANGED' | 'STATUS_CHANGED';
  changedBy: string;
  changedByName: string;
  changedAt: string;
  previousValues: {
    startDate?: string;
    endDate?: string;
    townId?: string;
    locationVenue?: string;
    status?: ActivityStatus;
  };
  newValues: {
    startDate?: string;
    endDate?: string;
    townId?: string;
    locationVenue?: string;
    status?: ActivityStatus;
  };
  reason?: string;
}

export interface IActivity {
  id: string;
  title: string;
  activityType: ActivityType;
  startDate: string;
  endDate: string;
  townId: string;
  town?: ITown;
  locationVenue: string;
  notes?: string;
  hostTownId: string;
  hostTown?: ITown;
  status: ActivityStatus;
  changeHistory: IActivityChangeLog[];
  attendanceCount?: {
    members: number;
    guests: number;
    total: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateActivityDto {
  title: string;
  activityType: ActivityType;
  startDate: string;
  endDate?: string;
  townId: string;
  locationVenue: string;
  notes?: string;
  hostTownId?: string;
}

export interface IUpdateActivityDto {
  title?: string;
  activityType?: ActivityType;
  startDate?: string;
  endDate?: string;
  townId?: string;
  locationVenue?: string;
  notes?: string;
  status?: ActivityStatus;
  changeReason?: string;
}

export interface IActivityQueryDto {
  page?: number;
  limit?: number;
  townId?: string;
  hostTownId?: string;
  year?: number;
  month?: number;
  activityType?: ActivityType;
  status?: ActivityStatus;
  search?: string;
}

export interface IActivityStats {
  totalActivities: number;
  upcomingCount: number;
  completedCount: number;
  avgAttendanceRate: number;
  totalGuestsReached: number;
  typeBreakdown: Record<ActivityType, number>;
}

export interface IPaginatedActivitiesResponse {
  items: IActivity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
