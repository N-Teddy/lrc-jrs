import { UserRole } from '../constants/roles.constant';
import type { IAuthUser } from './user.interface';

export interface ITown {
  id: string;
  name: string;
  code: string;
  activePcCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateTownDto {
  name: string;
  code: string;
}

export interface IUpdateTownDto {
  name?: string;
  code?: string;
}

export interface ITownContextState {
  activeTownId: string;
  activeTown?: ITown;
  userHomeTownId: string;
  isViewingHomeTown: boolean;
  canWriteCurrentTown: boolean;
  isReadOnly: boolean;
  availableTowns: ITown[];
}

export function evaluateTownPermissions(
  user: IAuthUser,
  targetTownId: string,
): { canRead: boolean; canWrite: boolean; isReadOnly: boolean } {
  if (user.account?.isAccessRevoked) {
    return { canRead: false, canWrite: false, isReadOnly: true };
  }

  // AP has full read and write everywhere
  if (user.role === UserRole.AP) {
    return { canRead: true, canWrite: true, isReadOnly: false };
  }

  const isHomeTown = String(user.homeTownId) === String(targetTownId);

  // PC has full access in home town, read-only in others
  if (user.role === UserRole.PC) {
    if (isHomeTown) {
      return { canRead: true, canWrite: true, isReadOnly: false };
    }
    return { canRead: true, canWrite: false, isReadOnly: true };
  }

  // Invited JR Member
  if (user.role === UserRole.MEMBER) {
    if (!user.account?.hasAppAccess) {
      return { canRead: false, canWrite: false, isReadOnly: true };
    }
    const allowed = (user.account.allowedReadTownIds || []).map(String);
    const canRead = allowed.includes(String(targetTownId));
    return { canRead, canWrite: false, isReadOnly: true };
  }

  return { canRead: false, canWrite: false, isReadOnly: true };
}
