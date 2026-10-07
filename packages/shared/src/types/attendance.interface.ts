import type { AttendeeType } from '../constants/activity.constant';
import type { IActivity } from './activity.interface';
import type { IUser } from './user.interface';

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
