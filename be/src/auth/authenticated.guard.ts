import { CanActivate, Injectable, Logger, UnauthorizedException, type ExecutionContext } from '@nestjs/common';

import { resolveRequestLogMeta, type RequestWithAuthUser } from './request-user';

/**
 * Requires a verified user on the request (after {@link KeycloakJwtAuthGuard}).
 * Matches oRPC `requireAuth` → HTTP 401.
 */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  private readonly logger = new Logger('AUTH');

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithAuthUser>();
    if (!req.user) {
      const { rid, path, outcome, errorName } = resolveRequestLogMeta(req);
      this.logger.warn('401 unauthorized', { rid, path, outcome, ...(errorName ? { errorName } : {}) });
      throw new UnauthorizedException({ message: 'Unauthorized' });
    }
    return true;
  }
}
