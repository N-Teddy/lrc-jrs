import type { IAuthUser } from '@jrs/shared';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: keyof IAuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IAuthUser;

    return data && user ? user[data] : user;
  },
);
