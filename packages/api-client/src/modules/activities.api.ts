import type { ActivityType, IActivity } from '@jrs/shared';
import type { HttpClient } from '../client';

export interface ICreateActivityDto {
  title: string;
  description?: string;
  activityType: ActivityType;
  date: string;
  location: string;
  isGlobal: boolean;
  townIds?: string[];
  hostTownId: string;
}

export class ActivitiesApi {
  constructor(private readonly http: HttpClient) {}

  public getAll(townId?: string): Promise<IActivity[]> {
    const query = townId ? `?townId=${townId}` : '';
    return this.http.get<IActivity[]>(`/activities${query}`);
  }

  public getById(id: string): Promise<IActivity> {
    return this.http.get<IActivity>(`/activities/${id}`);
  }

  public create(dto: ICreateActivityDto): Promise<IActivity> {
    return this.http.post<IActivity>('/activities', dto);
  }

  public linkReport(
    activityId: string,
    reportData: {
      driveFileId: string;
      driveViewUrl: string;
      fileName: string;
      notes?: string;
    },
  ): Promise<IActivity> {
    return this.http.post<IActivity>(
      `/activities/${activityId}/report`,
      reportData,
    );
  }
}
