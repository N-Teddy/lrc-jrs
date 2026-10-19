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

export type Gender = 'MALE' | 'FEMALE';

export interface IUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
  gender?: Gender;
  dateOfBirth: string;
  isJr: boolean;
  homeTownId: string;
  homeTown?: ITown;
  role: UserRole;
  isActivePC: boolean;
  isWhatsappVerified?: boolean;
  isTemporaryPassword?: boolean;
  integrationDate?: string;
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
  email?: string;
  avatarUrl?: string;
  gender?: Gender;
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

export interface ICreateMemberDto {
  fullName: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
  gender?: Gender;
  dateOfBirth: string;
  integrationDate?: string;
  role?: UserRole;
  homeTownId?: string;
  hasAppAccess?: boolean;
}

export interface IUpdateMemberDto {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  avatarUrl?: string;
  gender?: Gender;
  dateOfBirth?: string;
  integrationDate?: string;
  role?: UserRole;
  isActivePC?: boolean;
  homeTownId?: string;
  hasAppAccess?: boolean;
}

export interface IUpdateMemberAccessDto {
  hasAppAccess?: boolean;
  isAccessRevoked?: boolean;
  resendInvite?: boolean;
  channel?: 'email' | 'whatsapp';
  allowedReadTownIds?: string[];
}

export interface IChangeTownPcDto {
  townId: string;
  newPcUserId: string;
  outgoingPcUserId?: string;
  outgoingPcDisposition?: 'demote_to_member' | 'revoke_access';
}

export interface IMemberQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  townId?: string;
  role?: UserRole;
  isJr?: boolean;
  hasAppAccess?: boolean;
}

export interface IMemberStats {
  totalMembers: number;
  activeJrCount: number;
  activePcCount: number;
  appAccessCount: number;
  pendingActivationCount: number;
}

export interface IPaginatedMembersResponse {
  items: IUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
