import { ErrorCode, type IAuthUser, UserRole } from '@jrs/shared';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TOWN_SCOPE_KEY } from '../decorators/town-scope.decorator';
import { ForbiddenAppException } from '../exceptions/app.exception';

@Injectable()
export class TownScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const paramKey = this.reflector.getAllAndOverride<string>(TOWN_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If route doesn't specify town scope, let other guards handle it
    if (!paramKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as IAuthUser | undefined;

    if (!user) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
    }

    // Check account revocation status
    if (user.account?.isAccessRevoked) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
    }

    // Determine target town ID from params, query, body, or x-town-id header
    const targetTownId =
      request.params?.[paramKey] ||
      request.query?.[paramKey] ||
      request.body?.[paramKey] ||
      request.headers?.['x-town-id'] ||
      user.homeTownId;

    if (!targetTownId) {
      return true;
    }

    const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      request.method.toUpperCase(),
    );

    // Rule 1: AP has full access across all towns
    if (user.role === UserRole.AP) {
      return true;
    }

    // Rule 2: PC has full access to their home town
    const isHomeTown = String(user.homeTownId) === String(targetTownId);
    if (user.role === UserRole.PC) {
      if (isHomeTown) {
        return true;
      }
      // PC in other towns: Read-only access
      if (isWriteMethod) {
        throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
      }
      return true;
    }

    // Rule 3: Invited JR Member
    if (user.role === UserRole.MEMBER) {
      if (!user.account?.hasAppAccess) {
        throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
      }

      if (isWriteMethod) {
        throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
      }

      const allowedTowns = (user.account.allowedReadTownIds || []).map(String);
      if (!allowedTowns.includes(String(targetTownId))) {
        throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
      }

      return true;
    }

    throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
  }
}
