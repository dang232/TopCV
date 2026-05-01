import { CanActivate, Injectable, UnauthorizedException, type ExecutionContext } from '@nestjs/common';

import type { RequestWithAuthUser } from './request-user';

/**
 * Requires a verified user on the request (after {@link KeycloakJwtAuthGuard}).
 * Matches oRPC `requireAuth` → HTTP 401.
 */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithAuthUser>();
    if (!req.user) {
      throw new UnauthorizedException({ message: 'Unauthorized' });
    }
    return true;
  }
}
