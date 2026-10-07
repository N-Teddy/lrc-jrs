import { type ClientConfig, HttpClient } from './client';
import { ActivitiesApi } from './modules/activities.api';
import { AttendanceApi } from './modules/attendance.api';
import { AuthApi } from './modules/auth.api';
import { TownsApi } from './modules/towns.api';
import { UsersApi } from './modules/users.api';

export * from './client';
export * from './modules/activities.api';
export * from './modules/attendance.api';
export * from './modules/auth.api';
export * from './modules/towns.api';
export * from './modules/users.api';

export class JrsApiClient {
  public readonly http: HttpClient;
  public readonly auth: AuthApi;
  public readonly towns: TownsApi;
  public readonly users: UsersApi;
  public readonly activities: ActivitiesApi;
  public readonly attendance: AttendanceApi;

  constructor(config: ClientConfig) {
    this.http = new HttpClient(config);
    this.auth = new AuthApi(this.http);
    this.towns = new TownsApi(this.http);
    this.users = new UsersApi(this.http);
    this.activities = new ActivitiesApi(this.http);
    this.attendance = new AttendanceApi(this.http);
  }

  public setBaseUrl(url: string): void {
    this.http.setBaseUrl(url);
  }
}
