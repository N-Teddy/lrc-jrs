import type {
  IRegistrationLink,
  IRegistrationLinkPublicInfo,
  IUser,
} from '@jrs/shared';
import type { HttpClient } from '../client';

export interface ICreateRegistrationLinkDto {
  title: string;
  homeTownId?: string;
  expiresInHours?: number;
  expiresAt?: string;
  maxUses?: number;
  customMessage?: string;
}

export interface IReviewMemberDto {
  action: 'APPROVE' | 'REJECT';
  grantAppAccess?: boolean;
  notes?: string;
}

export interface IPublicSubmitResponse {
  success: boolean;
  referenceCode: string;
  fullName: string;
  memberId: string;
  message: string;
}

export class RegistrationLinksApi {
  constructor(private readonly http: HttpClient) {}

  // Public methods
  public getPublicInfo(token: string): Promise<IRegistrationLinkPublicInfo> {
    return this.http.get<IRegistrationLinkPublicInfo>(
      `/public/registration/${encodeURIComponent(token)}`,
    );
  }

  public submitPublicMember(
    token: string,
    data: FormData | Record<string, any>,
  ): Promise<IPublicSubmitResponse> {
    return this.http.post<IPublicSubmitResponse>(
      `/public/registration/${encodeURIComponent(token)}`,
      data,
    );
  }

  // Leader / Protected methods
  public getLinks(townId?: string): Promise<IRegistrationLink[]> {
    const query = townId ? `?townId=${encodeURIComponent(townId)}` : '';
    return this.http.get<IRegistrationLink[]>(`/registration-links${query}`);
  }

  public createLink(
    dto: ICreateRegistrationLinkDto,
  ): Promise<IRegistrationLink> {
    return this.http.post<IRegistrationLink>('/registration-links', dto);
  }

  public deactivateLink(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `/registration-links/${encodeURIComponent(id)}`,
    );
  }

  public getPendingReviews(townId?: string): Promise<IUser[]> {
    const query = townId ? `?townId=${encodeURIComponent(townId)}` : '';
    return this.http.get<IUser[]>(
      `/registration-links/pending-reviews${query}`,
    );
  }

  public reviewMember(
    memberId: string,
    dto: IReviewMemberDto,
  ): Promise<{ success: boolean; message: string; member: IUser }> {
    return this.http.patch<{
      success: boolean;
      message: string;
      member: IUser;
    }>(`/registration-links/review/${encodeURIComponent(memberId)}`, dto);
  }
}
