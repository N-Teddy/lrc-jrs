import type { AttendeeType } from '../constants/activity.constant.js';
import type { IActivity } from './activity.interface.js';
import type { IUser } from './user.interface.js';

export interface IGuestInfo {
  fullName: string;
  phoneNumber?: string;
  originTown?: string;
  notes?: string;
}

export interface IAttendanceItem {
  attendeeType: AttendeeType;
  memberId?: string;
  member?: IUser;
  guestInfo?: IGuestInfo;
  checkInTime: string;
}

export interface IAttendance {
  id: string;
  activityId: string;
  activity?: IActivity;
  recordedBy: string;
  recordedAt: string;
  attendees: IAttendanceItem[];
}
