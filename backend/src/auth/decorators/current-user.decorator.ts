import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: CurrentUserData }>();

    return data ? request.user[data] : request.user;
  },
);
