import type { ITown } from './town.interface.js';

export type IntakeStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface IRegistrationLink {
  id: string;
  token: string;
  title: string;
  homeTownId: string;
  homeTown?: ITown;
  createdBy: string;
  expiresAt: string;
  isActive: boolean;
  usageCount: number;
  maxUses?: number | null;
  customMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IRegistrationLinkPublicInfo {
  token: string;
  title: string;
  town: {
    id: string;
    name: string;
    code: string;
  };
  expiresAt: string;
  isExpired: boolean;
  isActive: boolean;
  customMessage?: string;
}

export interface IPublicMemberRegistrationDto {
  fullName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth: string;
  gender?: 'MALE' | 'FEMALE';
  integrationDate?: string;
  intakeNote?: string;
}
