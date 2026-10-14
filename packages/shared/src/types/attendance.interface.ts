import type {
  AttendanceStatus,
  AttendeeType,
} from '../constants/activity.constant.js';
import type { UserRole } from '../constants/roles.constant.js';
import type { IActivity } from './activity.interface.js';

export interface IGuestInfo {
  fullName: string;
  phoneNumber?: string;
  notes?: string;
}

export interface IAttendanceMemberSummary {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  role: UserRole;
  homeTownId: string;
}

export interface IAttendanceItem {
  id?: string;
  attendeeType: AttendeeType;
  memberId?: string;
  member?: IAttendanceMemberSummary;
  guestInfo?: IGuestInfo;
  checkInTime: string;
  status: AttendanceStatus;
}

export interface IAttendance {
  id: string;
  activityId: string;
  activity?: IActivity;
  recordedBy: string;
  recordedAt: string;
  isLocked?: boolean;
  lockedAt?: string;
  lockedBy?: string;
  lockReason?: string;
  attendees: IAttendanceItem[];
  summary: {
    totalPresent: number;
    membersPresent: number;
    guestsPresent: number;
  };
}

export interface IRecordAttendanceItemDto {
  attendeeType: AttendeeType;
  memberId?: string;
  guestInfo?: IGuestInfo;
  status: AttendanceStatus;
  checkInTime?: string;
}

export interface IRecordAttendanceDto {
  activityId: string;
  attendees: IRecordAttendanceItemDto[];
}

export type MemberEngagementLevel =
  | 'COMMITTED'
  | 'OCCASIONAL'
  | 'IRREGULAR'
  | 'NEEDS_FOLLOW_UP'
  | 'NEW';

export interface IMemberVisitedHub {
  townId: string;
  townName: string;
  townCode: string;
  visitCount: number;
}

export interface IMemberAttendanceHistoryItem {
  id: string;
  activityId: string;
  activityTitle: string;
  activityType: string;
  startDate: string;
  endDate: string;
  venue?: string;
  townId: string;
  townName: string;
  townCode: string;
  isExternal: boolean;
  status: AttendanceStatus;
  checkInTime?: string;
}

export interface IMemberAttendanceHistoryResponse {
  memberId: string;
  totalAttended: number;
  totalAbsent: number;
  hubActivitiesCount: number;
  hubAttendanceRate: number;
  externalVisitsCount: number;
  consecutiveAttended: number;
  consecutiveMissed: number;
  engagementLevel: MemberEngagementLevel;
  recentTurnoutRatio: string;
  visitedHubs: IMemberVisitedHub[];
  items: IMemberAttendanceHistoryItem[];
}
