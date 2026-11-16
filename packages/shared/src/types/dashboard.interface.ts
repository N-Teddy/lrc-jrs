import type {
  ActivityStatus,
  ActivityType,
} from '../constants/activity.constant.js';

export interface IDashboardKpis {
  totalMembers: number;
  activeJrCount: number;
  activePcCount: number;
  averageAttendanceRate: number; // percentage e.g. 78.4
  totalGuestsReached: number;
  guestAttendanceRate: number; // percentage of attendees that are guests
  upcomingActivitiesCount: number;
  completedActivitiesCount: number;
}

export interface IAttendanceTrendPoint {
  activityId: string;
  title: string;
  date: string;
  activityType: ActivityType;
  membersPresent: number;
  guestsPresent: number;
  totalPresent: number;
  turnoutRate: number; // percentage
}

export interface IUpcomingActivitySpotlight {
  id: string;
  title: string;
  activityType: ActivityType;
  startDate: string;
  endDate: string;
  locationVenue?: string;
  hostTownName: string;
  daysUntil: number;
  hoursUntil: number;
  isToday: boolean;
}

export interface IDemographicsStats {
  maleCount: number;
  femaleCount: number;
  malePercentage: number;
  femalePercentage: number;
  unspecifiedGenderCount: number;
  ageBrackets: {
    junior18to21: number;
    core22to25: number;
    senior26to30: number;
    mentors30Plus: number;
  };
}

export interface IActivityTypeDistribution {
  type: ActivityType;
  count: number;
  percentage: number;
}

export interface IUpcomingBirthday {
  id: string;
  fullName: string;
  avatarUrl?: string;
  dateOfBirth: string;
  birthMonth: number;
  birthDay: number;
  ageTurning: number;
  isToday: boolean;
  daysUntil: number;
  phoneNumber?: string;
  homeTownName?: string;
}

export interface IRecentActivitySummary {
  id: string;
  title: string;
  activityType: ActivityType;
  startDate: string;
  endDate: string;
  status: ActivityStatus;
  turnoutRate: number;
  totalPresent: number;
  hasReport: boolean;
  isAttendanceLocked: boolean;
}

export interface IOperationalAlerts {
  pendingIntakesCount: number;
  unsealedAttendanceCount: number;
  missingReportsCount: number;
  recentTransfersCount: number;
}

export interface IRecentTransferItem {
  id: string;
  memberId: string;
  memberName: string;
  fromTownName: string;
  toTownName: string;
  transferredAt: string;
  reason?: string;
}

export interface IDashboardOverviewDto {
  kpis: IDashboardKpis;
  attendanceTrend: IAttendanceTrendPoint[];
  upcomingActivity?: IUpcomingActivitySpotlight;
  demographics: IDemographicsStats;
  activityTypeDistribution: IActivityTypeDistribution[];
  upcomingBirthdays: IUpcomingBirthday[];
  hasBirthdayToday: boolean;
  todayCelebrants: IUpcomingBirthday[];
  recentActivities: IRecentActivitySummary[];
  operationalAlerts: IOperationalAlerts;
  recentTransfers: IRecentTransferItem[];
}
