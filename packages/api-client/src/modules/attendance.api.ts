import type { IAttendance, IAttendanceItem } from '@jrs/shared';
import type { HttpClient } from '../client';

export interface IRecordAttendanceDto {
  activityId: string;
  attendees: IAttendanceItem[];
}

export class AttendanceApi {
  constructor(private readonly http: HttpClient) {}

  public getByActivity(activityId: string): Promise<IAttendance> {
    return this.http.get<IAttendance>(`/attendance/activity/${activityId}`);
  }

  public record(dto: IRecordAttendanceDto): Promise<IAttendance> {
    return this.http.post<IAttendance>('/attendance', dto);
  }
}
