import { HttpException, Inject, Injectable } from '@nestjs/common';



import { devErrorDetails, restHttpException } from '../../shared/http/rest-error';

import { isProd, logErrorDev } from '../../shared/logging/logger';

import {

  InvalidCredentialsError,

  InvalidRoleError,

  KeycloakAccountNotReadyError,

  KeycloakBadResponseError,

  KeycloakConflictError,

  KeycloakForbiddenError,

  KeycloakUnreachableError,

  MisconfigError,

} from '../keycloak/keycloak-auth.errors';

import type { KeycloakTokenResponse } from '../keycloak/keycloak-auth.service';

import { KeycloakAuthService } from '../keycloak/keycloak-auth.service';



function getKeycloakClientId(): string {

  return (process.env.KEYCLOAK_CLIENT_ID ?? 'topcv-api').trim() || 'topcv-api';

}

/** Allowed when unset (demo). Only `ALLOW_ADMIN_SIGNUP=false` blocks admin self-signup. */
function allowAdminSignup(): boolean {
  return (process.env.ALLOW_ADMIN_SIGNUP ?? '').trim().toLowerCase() !== 'false';
}



export type AuthTokenBundle = {

  accessToken: string;

  refreshToken?: string;

  idToken?: string;

  expiresIn?: number;

  refreshExpiresIn?: number;

  tokenType?: string;

  scope?: string;

};



function bundleFromKeycloak(tokens: KeycloakTokenResponse, refreshFallback?: string): AuthTokenBundle {

  return {

    accessToken: tokens.access_token,

    refreshToken: tokens.refresh_token ?? refreshFallback,

    idToken: tokens.id_token,

    expiresIn: tokens.expires_in,

    refreshExpiresIn: tokens.refresh_expires_in,

    tokenType: tokens.token_type,

    scope: tokens.scope,

  };

}



function rethrowKeycloakTransportErrors(op: 'login' | 'refresh' | 'logout', err: unknown): void {

  if (err instanceof MisconfigError) {

    logErrorDev(`[auth.${op}] misconfig`, undefined, err);

    throw restHttpException(500, 'MISCONFIG', `${op} failed`, { message: err.message });

  }

  if (err instanceof KeycloakUnreachableError) {

    logErrorDev(`[auth.${op}] keycloak unreachable`, undefined, err);

    throw restHttpException(502, 'KEYCLOAK_UNREACHABLE', `${op} failed`, devErrorDetails(err));

  }

  if (err instanceof KeycloakBadResponseError) {

    logErrorDev(`[auth.${op}] keycloak bad response`, { status: err.status }, err);

    throw restHttpException(502, 'KEYCLOAK_BAD_RESPONSE', `${op} failed`, { status: err.status, body: err.body });

  }

}



function mapRegisterError(err: unknown): never {

  if (err instanceof HttpException) throw err;



  if (err instanceof MisconfigError) {

    logErrorDev('[auth.register] misconfig', undefined, err);

    throw restHttpException(500, 'MISCONFIG', 'register failed', { message: err.message });

  }



  if (err instanceof InvalidRoleError) {

    throw restHttpException(400, 'INVALID_ROLE', 'Invalid role', { role: err.role });

  }



  if (err instanceof KeycloakConflictError) {

    throw restHttpException(409, 'CONFLICT', err.message, err.details);

  }



  if (err instanceof KeycloakUnreachableError) {

    logErrorDev('[auth.register] keycloak unreachable', undefined, err);

    throw restHttpException(502, 'KEYCLOAK_UNREACHABLE', 'register failed', devErrorDetails(err));

  }



  if (err instanceof KeycloakBadResponseError) {

    logErrorDev('[auth.register] keycloak bad response', { status: err.status }, err);

    throw restHttpException(502, 'KEYCLOAK_BAD_RESPONSE', 'register failed', { status: err.status, body: err.body });

  }



  if (err instanceof KeycloakForbiddenError) {

    logErrorDev('[auth.register] keycloak forbidden', { step: err.step }, err);

    throw restHttpException(502, 'KEYCLOAK_FORBIDDEN', 'register failed', {

      status: err.status,

      step: err.step,

      body: err.body,

    });

  }



  logErrorDev('[auth.register] failed', undefined, err);

  throw restHttpException(500, 'INTERNAL', 'register failed', devErrorDetails(err));

}



@Injectable()

export class AuthFacade {

  constructor(@Inject(KeycloakAuthService) private readonly keycloak: KeycloakAuthService | undefined) {}



  private getKeycloak(): KeycloakAuthService {

    if (this.keycloak) return this.keycloak;

    throw restHttpException(500, 'MISCONFIG', 'auth is not configured', {

      message:

        'Keycloak auth provider is unavailable. Ensure AuthRestModule is loaded and KEYCLOAK_* env vars are set (KEYCLOAK_ISSUER at minimum).',

    });

  }



  async register(input: {

    username: string;

    email: string;

    password: string;

    role: 'admin' | 'staff';

  }): Promise<{ created: true; userId?: string }> {

    try {
      if (input.role === 'admin' && !allowAdminSignup()) {
        throw restHttpException(403, 'ADMIN_SIGNUP_DISABLED', 'Admin registration is disabled');
      }

      const res = await this.getKeycloak().registerUser({ ...input, role: input.role });

      if (!isProd()) return { created: true, userId: res.userId };

      return { created: true };

    } catch (err) {

      mapRegisterError(err);

    }

  }



  async login(input: { usernameOrEmail: string; password: string }): Promise<AuthTokenBundle> {

    try {

      const clientId = getKeycloakClientId();

      const tokens = await this.getKeycloak().loginWithPasswordGrant({ ...input, clientId });

      return bundleFromKeycloak(tokens);

    } catch (err) {

      if (err instanceof HttpException) throw err;

      if (err instanceof KeycloakAccountNotReadyError) {

        throw restHttpException(

          409,

          'ACCOUNT_NOT_READY',

          'Account is not fully set up. Please complete any required actions in Keycloak or contact support.',

          err.details,

        );

      }

      if (err instanceof InvalidCredentialsError) {

        throw restHttpException(401, 'WRONG_CREDENTIALS', 'Wrong username or password');

      }

      rethrowKeycloakTransportErrors('login', err);

      logErrorDev('[auth.login] failed', undefined, err);

      throw restHttpException(500, 'INTERNAL', 'login failed', devErrorDetails(err));

    }

  }



  async refresh(input: { refreshToken: string }): Promise<AuthTokenBundle> {

    try {

      const clientId = getKeycloakClientId();

      const tokens = await this.getKeycloak().refreshWithRefreshTokenGrant({ ...input, clientId });

      return bundleFromKeycloak(tokens, input.refreshToken);

    } catch (err) {

      if (err instanceof HttpException) throw err;

      if (err instanceof InvalidCredentialsError) {

        throw restHttpException(401, 'REFRESH_FAILED', 'Session expired. Please sign in again.');

      }

      rethrowKeycloakTransportErrors('refresh', err);

      logErrorDev('[auth.refresh] failed', undefined, err);

      throw restHttpException(500, 'INTERNAL', 'refresh failed', devErrorDetails(err));

    }

  }



  async logout(input: { refreshToken: string }): Promise<{ loggedOut: true }> {

    try {

      const clientId = getKeycloakClientId();

      await this.getKeycloak().logoutWithRefreshToken({ refreshToken: input.refreshToken, clientId });

      return { loggedOut: true };

    } catch (err) {

      if (err instanceof HttpException) throw err;

      rethrowKeycloakTransportErrors('logout', err);

      logErrorDev('[auth.logout] failed', undefined, err);

      throw restHttpException(401, 'LOGOUT_FAILED', 'Logout failed');

    }

  }

}


