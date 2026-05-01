import { HttpException, Injectable } from '@nestjs/common';

import { devErrorDetails, restHttpException } from '../../shared/http/rest-error';
import { isProd, logErrorDev } from '../../shared/logging/logger';
import {
  InvalidRoleError,
  KeycloakAccountNotReadyError,
  KeycloakBadResponseError,
  KeycloakConflictError,
  KeycloakForbiddenError,
  KeycloakUnreachableError,
  MisconfigError,
} from '../keycloak/keycloak-auth.errors';
import { KeycloakAuthService } from '../keycloak/keycloak-auth.service';

function getKeycloakClientId(): string {
  return (process.env.KEYCLOAK_CLIENT_ID ?? 'topcv-api').trim() || 'topcv-api';
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
  constructor(private readonly keycloak: KeycloakAuthService) {}

  async register(input: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'staff';
  }): Promise<{ created: true; userId?: string }> {
    try {
      const res = await this.keycloak.registerUser({ ...input, role: input.role });
      // Dev-only: returning userId makes diagnosing Keycloak required-actions issues easier.
      if (!isProd()) return { created: true, userId: res.userId };
      return { created: true };
    } catch (err) {
      mapRegisterError(err);
    }
  }

  async login(input: { usernameOrEmail: string; password: string }): Promise<{
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresIn?: number;
    refreshExpiresIn?: number;
    tokenType?: string;
    scope?: string;
  }> {
    try {
      const clientId = getKeycloakClientId();
      const tokens = await this.keycloak.loginWithPasswordGrant({ ...input, clientId });
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresIn: tokens.expires_in,
        refreshExpiresIn: tokens.refresh_expires_in,
        tokenType: tokens.token_type,
        scope: tokens.scope,
      };
    } catch (err) {
      if (err instanceof KeycloakAccountNotReadyError) {
        throw restHttpException(
          409,
          'ACCOUNT_NOT_READY',
          'Account is not fully set up. Please complete any required actions in Keycloak or contact support.',
          err.details,
        );
      }
      if (err instanceof HttpException) throw err;
      logErrorDev('[auth.login] failed', undefined, err);
      throw restHttpException(401, 'INVALID_CREDENTIALS', 'Invalid credentials', devErrorDetails(err));
    }
  }

  async logout(input: { refreshToken: string }): Promise<{ loggedOut: true }> {
    try {
      const clientId = getKeycloakClientId();
      await this.keycloak.logoutWithRefreshToken({ refreshToken: input.refreshToken, clientId });
      return { loggedOut: true };
    } catch (err) {
      logErrorDev('[auth.logout] failed', undefined, err);
      throw restHttpException(401, 'LOGOUT_FAILED', 'Logout failed');
    }
  }
}

