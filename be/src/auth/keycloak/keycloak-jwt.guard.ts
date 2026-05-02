import { CanActivate, Inject, Injectable, type ExecutionContext } from '@nestjs/common';



import type { RequestWithAuthUser } from '../request-user';

import { KeycloakJwtVerifier } from './keycloak-jwt.verifier';



@Injectable()

export class KeycloakJwtAuthGuard implements CanActivate {

  constructor(@Inject(KeycloakJwtVerifier) private readonly verifier: KeycloakJwtVerifier) {}



  async canActivate(context: ExecutionContext): Promise<boolean> {

    const req = context.switchToHttp().getRequest<RequestWithAuthUser>();

    const authHeader = typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;



    try {

      const result = await this.verifier.verifyAuthorizationHeaderDetailed(authHeader);

      req.user = result.user;

      req.authInfo = { outcome: result.outcome, errorName: result.errorName };

    } catch {

      req.user = null;

      req.authInfo = { outcome: 'jwt_verify_failed' };

    }



    return true;

  }

}


