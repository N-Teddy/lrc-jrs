import type { IUser, UserRole } from '@jrs/shared';
import type { HttpClient } from '../client';

export interface ICreateUserDto {
  fullName: string;
  phoneNumber: string;
  email?: string;
  password?: string;
  dateOfBirth: string;
  homeTownId: string;
  role: UserRole;
  isActivePC?: boolean;
}

export interface ITransferTownDto {
  targetTownId: string;
  reason?: string;
}

export interface IAssignTownAccessDto {
  allowedReadTownIds: string[];
}

export class UsersApi {
  constructor(private readonly http: HttpClient) {}

  public getByTown(townId: string): Promise<IUser[]> {
    return this.http.get<IUser[]>(`/users?townId=${townId}`);
  }

  public getById(id: string): Promise<IUser> {
    return this.http.get<IUser>(`/users/${id}`);
  }

  public create(dto: ICreateUserDto): Promise<IUser> {
    return this.http.post<IUser>('/users', dto);
  }

  public transferTown(userId: string, dto: ITransferTownDto): Promise<IUser> {
    return this.http.post<IUser>(`/users/${userId}/transfer`, dto);
  }

  public setAccessRevocation(
    userId: string,
    isRevoked: boolean,
  ): Promise<IUser> {
    return this.http.patch<IUser>(`/users/${userId}/access-revocation`, {
      isRevoked,
    });
  }

  public updateAllowedTowns(
    userId: string,
    dto: IAssignTownAccessDto,
  ): Promise<IUser> {
    return this.http.patch<IUser>(`/users/${userId}/allowed-towns`, dto);
  }
}
