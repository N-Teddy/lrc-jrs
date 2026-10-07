import type {
  IAuthUser,
  IForgotPasswordResponse,
  ILoginResponse,
  IRefreshTokenResponse,
  IResetPasswordResponse,
  IVerifyResetCodeResponse,
} from '@jrs/shared';
import type { HttpClient } from '../client';

export class AuthApi {
  constructor(private readonly http: HttpClient) {}

  public login(identifier: string, password: string): Promise<ILoginResponse> {
    return this.http.post<ILoginResponse>('/auth/login', {
      identifier,
      password,
    });
  }

  public completeSetup(newPassword: string): Promise<ILoginResponse> {
    return this.http.post<ILoginResponse>('/auth/complete-setup', {
      newPassword,
    });
  }

  public refresh(refreshToken: string): Promise<IRefreshTokenResponse> {
    return this.http.post<IRefreshTokenResponse>('/auth/refresh', {
      refreshToken,
    });
  }

  public logout(refreshToken: string): Promise<{ message: string }> {
    return this.http.post<{ message: string }>('/auth/logout', {
      refreshToken,
    });
  }

  public forgotPassword(
    identifier: string,
    channel?: 'whatsapp' | 'email' | 'auto',
  ): Promise<IForgotPasswordResponse> {
    return this.http.post<IForgotPasswordResponse>('/auth/forgot-password', {
      identifier,
      channel: channel || 'auto',
    });
  }

  public verifyResetCode(
    identifier: string,
    code: string,
  ): Promise<IVerifyResetCodeResponse> {
    return this.http.post<IVerifyResetCodeResponse>('/auth/verify-reset-code', {
      identifier,
      code,
    });
  }

  public resetPassword(
    resetToken: string,
    newPassword: string,
  ): Promise<IResetPasswordResponse> {
    return this.http.post<IResetPasswordResponse>('/auth/reset-password', {
      resetToken,
      newPassword,
    });
  }

  public getProfile(): Promise<IAuthUser> {
    return this.http.get<IAuthUser>('/auth/me');
  }

  public changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      '/auth/change-password',
      { currentPassword, newPassword },
    );
  }
}
