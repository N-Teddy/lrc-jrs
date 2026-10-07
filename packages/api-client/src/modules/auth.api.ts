import type { IAuthUser, ILoginResponse } from '@jrs/shared';
import type { HttpClient } from '../client';

export class AuthApi {
  constructor(private readonly http: HttpClient) {}

  public login(
    phoneNumber: string,
    passwordHash: string,
  ): Promise<ILoginResponse> {
    return this.http.post<ILoginResponse>('/auth/login', {
      phoneNumber,
      password: passwordHash,
    });
  }

  public getProfile(): Promise<IAuthUser> {
    return this.http.get<IAuthUser>('/auth/me');
  }
}
