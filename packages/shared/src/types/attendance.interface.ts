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
  attendees: IAttendanceItem[];
  summary: {
    totalPresent: number;
    membersPresent: number;
    guestsPresent: number;
    totalExcused: number;
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
