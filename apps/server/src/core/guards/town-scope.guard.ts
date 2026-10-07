import { type IAuthUser, UserRole } from '@jrs/shared';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TOWN_SCOPE_KEY } from '../decorators/town-scope.decorator';

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
      throw new ForbiddenException('User is not authenticated');
    }

    // Check account revocation status
    if (user.account?.isAccessRevoked) {
      throw new ForbiddenException(
        'Your access to the platform has been revoked',
      );
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
        throw new ForbiddenException(
          'Contact Persons (PCs) only have write permissions within their assigned town',
        );
      }
      return true;
    }

    // Rule 3: Invited JR Member
    if (user.role === UserRole.MEMBER) {
      if (!user.account?.hasAppAccess) {
        throw new ForbiddenException(
          'You do not have access to view this town',
        );
      }

      if (isWriteMethod) {
        throw new ForbiddenException(
          'Members only have read access to town data',
        );
      }

      const allowedTowns = (user.account.allowedReadTownIds || []).map(String);
      if (!allowedTowns.includes(String(targetTownId))) {
        throw new ForbiddenException(
          'You have not been granted access to view this town',
        );
      }

      return true;
    }

    throw new ForbiddenException('Permission denied for this town operation');
  }
}
