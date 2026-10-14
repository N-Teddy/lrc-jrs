import { UserRole } from '@jrs/shared';
import { AccountStatus } from '../../schemas';

export interface SeedUserData {
  fullName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  isJr: boolean;
  role: UserRole;
  isActivePC: boolean;
  homeTownCode: string;
  account: {
    status: AccountStatus;
    hasAppAccess: boolean;
    isAccessRevoked?: boolean;
    allowedReadTownCodes?: string[];
  };
}

/**
 * Super Administrator / Overseer (AP).
 * Age > 30 (Mentor / Overseer rule).
 * Has full global access.
 */
export const SEED_ADMIN_USERS: SeedUserData[] = [
  {
    fullName: 'Animateur Principal LRC',
    phoneNumber: '+237670000001',
    email: 'ap.overseer@lrcjrs.org',
    dateOfBirth: '1988-01-15', // Age > 30
    isJr: false,
    role: UserRole.AP,
    isActivePC: false,
    homeTownCode: 'DLA',
    account: {
      status: AccountStatus.ACTIVE,
      hasAppAccess: true,
      isAccessRevoked: false,
      allowedReadTownCodes: [],
    },
  },
];

/**
 * Personnes Contact (PCs) - 2 active PCs per town.
 * Age must be between 18 and 30 (JR age rule).
 */
export const SEED_PC_USERS: SeedUserData[] = [
  // Douala PCs
  {
    fullName: 'PC Douala 1 (Jean Dupont)',
    phoneNumber: '+237671110001',
    email: 'pc.douala1@lrcjrs.org',
    dateOfBirth: '2000-02-14', // Age ~26
    isJr: true,
    role: UserRole.PC,
    isActivePC: true,
    homeTownCode: 'DLA',
    account: {
      status: AccountStatus.ACTIVE,
      hasAppAccess: true,
      isAccessRevoked: false,
    },
  },
  {
    fullName: 'PC Douala 2 (Marie Claire)',
    phoneNumber: '+237671110002',
    email: 'pc.douala2@lrcjrs.org',
    dateOfBirth: '2001-07-22', // Age ~25
    isJr: true,
    role: UserRole.PC,
    isActivePC: true,
    homeTownCode: 'DLA',
    account: {
      status: AccountStatus.ACTIVE,
      hasAppAccess: true,
      isAccessRevoked: false,
    },
  },

  // Yaoundé PCs
  {
    fullName: 'PC Yaoundé 1 (Emmanuel Nguema)',
    phoneNumber: '+237672220001',
    email: 'pc.yaounde1@lrcjrs.org',
    dateOfBirth: '1999-10-05', // Age ~27
    isJr: true,
    role: UserRole.PC,
    isActivePC: true,
    homeTownCode: 'YDE',
    account: {
      status: AccountStatus.ACTIVE,
      hasAppAccess: true,
      isAccessRevoked: false,
    },
  },
  {
    fullName: 'PC Yaoundé 2 (Grace Ndongo)',
    phoneNumber: '+237672220002',
    email: 'pc.yaounde2@lrcjrs.org',
    dateOfBirth: '2002-04-18', // Age ~24
    isJr: true,
    role: UserRole.PC,
    isActivePC: true,
    homeTownCode: 'YDE',
    account: {
      status: AccountStatus.ACTIVE,
      hasAppAccess: true,
      isAccessRevoked: false,
    },
  },

  // Bafoussam PCs
  {
    fullName: 'PC Bafoussam 1 (David Kamga)',
    phoneNumber: '+237673330001',
    email: 'pc.bafoussam1@lrcjrs.org',
    dateOfBirth: '2001-12-01', // Age ~25
    isJr: true,
    role: UserRole.PC,
    isActivePC: true,
    homeTownCode: 'BAF',
    account: {
      status: AccountStatus.ACTIVE,
      hasAppAccess: true,
      isAccessRevoked: false,
    },
  },
  {
    fullName: 'PC Bafoussam 2 (Esther Fotso)',
    phoneNumber: '+237673330002',
    email: 'pc.bafoussam2@lrcjrs.org',
    dateOfBirth: '2003-05-30', // Age ~23
    isJr: true,
    role: UserRole.PC,
    isActivePC: true,
    homeTownCode: 'BAF',
    account: {
      status: AccountStatus.ACTIVE,
      hasAppAccess: true,
      isAccessRevoked: false,
    },
  },
  // Edéa PCs
  {
    fullName: 'PC Edéa 1 (Patrice Manga)',
    phoneNumber: '+237677770001',
    email: 'pc.edea1@lrcjrs.org',
    dateOfBirth: '2001-08-10', // Age ~25
    isJr: true,
    role: UserRole.PC,
    isActivePC: true,
    homeTownCode: 'EDA',
    account: {
      status: AccountStatus.ACTIVE,
      hasAppAccess: true,
      isAccessRevoked: false,
    },
  },
  {
    fullName: 'PC Edéa 2 (Chantal Ebongue)',
    phoneNumber: '+237677770002',
    email: 'pc.edea2@lrcjrs.org',
    dateOfBirth: '2002-11-20', // Age ~24
    isJr: true,
    role: UserRole.PC,
    isActivePC: true,
    homeTownCode: 'EDA',
    account: {
      status: AccountStatus.ACTIVE,
      hasAppAccess: true,
      isAccessRevoked: false,
    },
  },
];

/**
 * Standard JR Members for development and testing.
 * Age must be between 18 and 30.
 * Covers multiple statuses: ACTIVE, PENDING_ACTIVATION, MUST_CHANGE_PASSWORD.
 */
export const SEED_MEMBER_USERS: SeedUserData[] = [
  // Douala active member with cross-town read access to Yaoundé
  {
    fullName: 'Member Douala (Samuel Eto)',
    phoneNumber: '+237674440001',
    email: 'member.dla1@lrcjrs.org',
    dateOfBirth: '2004-03-12', // Age ~22
    isJr: true,
    role: UserRole.MEMBER,
    isActivePC: false,
    homeTownCode: 'DLA',
    account: {
      status: AccountStatus.ACTIVE,
      hasAppAccess: true,
      isAccessRevoked: false,
      allowedReadTownCodes: ['DLA', 'YDE'],
    },
  },

  // Yaoundé pending activation member (no app access until activated)
  {
    fullName: 'Member Yaoundé (Florence Atangana)',
    phoneNumber: '+237675550001',
    email: 'member.yde1@lrcjrs.org',
    dateOfBirth: '2002-11-20', // Age ~24
    isJr: true,
    role: UserRole.MEMBER,
    isActivePC: false,
    homeTownCode: 'YDE',
    account: {
      status: AccountStatus.PENDING_ACTIVATION,
      hasAppAccess: false,
      isAccessRevoked: false,
    },
  },

  // Bafoussam member required to change temporary password
  {
    fullName: 'Member Bafoussam (Cedric Tagne)',
    phoneNumber: '+237676660001',
    email: 'member.baf1@lrcjrs.org',
    dateOfBirth: '2005-08-08', // Age ~21
    isJr: true,
    role: UserRole.MEMBER,
    isActivePC: false,
    homeTownCode: 'BAF',
    account: {
      status: AccountStatus.MUST_CHANGE_PASSWORD,
      hasAppAccess: true,
      isAccessRevoked: false,
    },
  },
];
