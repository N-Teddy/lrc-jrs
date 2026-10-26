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
  password?: string;
  isTemporaryPassword?: boolean;
  gender?: 'MALE' | 'FEMALE';
  avatarUrl?: string;
  account: {
    status: AccountStatus;
    hasAppAccess: boolean;
    isAccessRevoked?: boolean;
    allowedReadTownCodes?: string[];
  };
}

const seedPassword = process.env.SEED_DEFAULT_PASSWORD || 'ChangeMe123!';

export const SEED_ADMIN_USERS: SeedUserData[] = [
  {
    fullName: 'Animateur Principal LRC',
    phoneNumber: '+237670000001',
    email: 'ap.overseer@lrcjrs.org',
    dateOfBirth: '1988-01-15',
    isJr: false,
    role: UserRole.AP,
    isActivePC: false,
    homeTownCode: 'DLA',
    password: seedPassword,
    isTemporaryPassword: true,
    account: {
      status: AccountStatus.MUST_CHANGE_PASSWORD,
      hasAppAccess: true,
      isAccessRevoked: false,
      allowedReadTownCodes: [],
    },
  },
  {
    fullName: 'Assistant Animateur Principal',
    phoneNumber: '+237670000002',
    email: 'ap.assistant@lrcjrs.org',
    dateOfBirth: '1990-05-20',
    isJr: false,
    role: UserRole.AP,
    isActivePC: false,
    homeTownCode: 'DLA',
    password: seedPassword,
    isTemporaryPassword: true,
    account: {
      status: AccountStatus.MUST_CHANGE_PASSWORD,
      hasAppAccess: true,
      isAccessRevoked: false,
      allowedReadTownCodes: [],
    },
  },
];

export const SEED_PROD_PC_USER: SeedUserData = {
  fullName: 'Ngangman Teddy',
  phoneNumber: '+237693087159',
  email: 'teddy.webdev@gmail.com',
  dateOfBirth: '2005-10-07',
  isJr: true,
  role: UserRole.PC,
  isActivePC: true,
  homeTownCode: 'DLA',
  password: seedPassword,
  isTemporaryPassword: true,
  gender: 'MALE',
  account: {
    status: AccountStatus.MUST_CHANGE_PASSWORD,
    hasAppAccess: true,
    isAccessRevoked: false,
    allowedReadTownCodes: ['DLA', 'YDE', 'EDA', 'BAF'],
  },
};

export const SEED_PC_USERS: SeedUserData[] = [
  {
    fullName: 'PC Douala 1 (Jean Dupont)',
    phoneNumber: '+237671110001',
    email: 'pc.douala1@lrcjrs.org',
    dateOfBirth: '2000-02-14',
    isJr: true,
    role: UserRole.PC,
    isActivePC: true,
    homeTownCode: 'DLA',
    password: seedPassword,
    isTemporaryPassword: true,
    account: {
      status: AccountStatus.MUST_CHANGE_PASSWORD,
      hasAppAccess: true,
      isAccessRevoked: false,
    },
  },
  {
    fullName: 'PC Douala 2 (Marie Claire)',
    phoneNumber: '+237671110002',
    email: 'pc.douala2@lrcjrs.org',
    dateOfBirth: '2001-07-22',
    isJr: true,
    role: UserRole.PC,
    isActivePC: true,
    homeTownCode: 'DLA',
    password: seedPassword,
    isTemporaryPassword: true,
    account: {
      status: AccountStatus.MUST_CHANGE_PASSWORD,
      hasAppAccess: true,
      isAccessRevoked: false,
    },
  },
];

export const SEED_MEMBER_USERS: SeedUserData[] = [
  {
    fullName: 'Member Douala 1',
    phoneNumber: '+237672220001',
    email: 'member.dla1@lrcjrs.org',
    dateOfBirth: '2004-03-10',
    isJr: true,
    role: UserRole.MEMBER,
    isActivePC: false,
    homeTownCode: 'DLA',
    password: seedPassword,
    isTemporaryPassword: true,
    account: {
      status: AccountStatus.MUST_CHANGE_PASSWORD,
      hasAppAccess: true,
      isAccessRevoked: false,
    },
  },
  {
    fullName: 'Member Douala 2',
    phoneNumber: '+237672220002',
    email: 'member.dla2@lrcjrs.org',
    dateOfBirth: '2003-11-05',
    isJr: true,
    role: UserRole.MEMBER,
    isActivePC: false,
    homeTownCode: 'DLA',
    password: seedPassword,
    isTemporaryPassword: true,
    account: {
      status: AccountStatus.MUST_CHANGE_PASSWORD,
      hasAppAccess: true,
      isAccessRevoked: false,
    },
  },
];
