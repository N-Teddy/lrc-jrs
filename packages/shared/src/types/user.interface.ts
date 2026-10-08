import type { UserRole } from '../constants/roles.constant.js';
import type { ITown } from './town.interface.js';

export interface ITownTransfer {
  fromTownId: string;
  toTownId: string;
  transferredAt: string;
  transferredBy: string;
  reason?: string;
}

export interface IUserAccount {
  hasAppAccess: boolean;
  isAccessRevoked: boolean;
  allowedReadTownIds: string[];
  invitedBy?: string;
  invitedAt?: string;
}

export interface IUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth: string;
  isJr: boolean;
  homeTownId: string;
  homeTown?: ITown;
  role: UserRole;
  isActivePC: boolean;
  account: IUserAccount;
  transferHistory: ITownTransfer[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IAuthUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  homeTownId: string;
  isActivePC: boolean;
  account: IUserAccount;
}

export interface ILoginResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  requiresPasswordChange?: boolean;
  setupToken?: string;
  message?: string;
  user: IAuthUser;
}

export interface IForgotPasswordResponse {
  sent: boolean;
  channel?: string;
  maskedDestination?: string;
  expiresInMinutes?: number;
  message: string;
}

export interface IVerifyResetCodeResponse {
  valid: boolean;
  resetToken: string;
  expiresInMinutes: number;
  message: string;
}

export interface IResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface IRefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
