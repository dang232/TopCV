import { CanActivate, Injectable, type ExecutionContext } from '@nestjs/common';

import { KeycloakJwtVerifier } from './keycloak-jwt.verifier';

type ReqWithUser = {
  headers?: Record<string, unknown>;
  user?: unknown;
};

@Injectable()
export class KeycloakJwtAuthGuard implements CanActivate {
  constructor(private readonly verifier: KeycloakJwtVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ReqWithUser>();
    const authHeader = typeof req?.headers?.authorization === 'string' ? req.headers.authorization : undefined;

    try {
      req.user = await this.verifier.verifyAuthorizationHeader(authHeader);
    } catch {
      req.user = null;
    }

    // RBAC is enforced by oRPC middleware (per-procedure).
    return true;
  }
}
