import {
  CanActivate,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from './roles.decorator';
import { resolveRequestLogMeta, type RequestWithAuthUser } from './request-user';
import type { Role } from './roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {
  }

  private readonly logger = new Logger('AUTH');

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) {
      return true;
    }

    const req = context.switchToHttp().getRequest<RequestWithAuthUser>();
    const user = req.user;
    if (!user) {
      const { rid, path, outcome, errorName } = resolveRequestLogMeta(req);
      this.logger.warn('401 unauthorized (roles required)', { rid, path, outcome, ...(errorName ? { errorName } : {}) });
      throw new UnauthorizedException({ message: 'Unauthorized' });
    }

    const allowed = new Set(user.roles);
    if (roles.some((role) => allowed.has(role))) {
      return true;
    }

    throw new ForbiddenException({ message: 'Forbidden' });
  }
}
