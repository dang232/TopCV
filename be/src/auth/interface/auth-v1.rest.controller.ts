import { Body, Controller, HttpException, Inject, Post } from '@nestjs/common';
import { z } from 'zod';

import { HTTP_API_V1_AUTH_PATH } from '../../http/api-path.constants';
import { KeycloakAuthService } from '../keycloak/keycloak-auth.service';
import { logErrorDev } from '../../shared/logging/logger';
import { devErrorDetails, restHttpException } from '../../shared/http/rest-error';
import {
  InvalidRoleError,
  KeycloakAccountNotReadyError,
  KeycloakBadResponseError,
  KeycloakConflictError,
  KeycloakForbiddenError,
  KeycloakUnreachableError,
  MisconfigError,
} from '../keycloak/keycloak-auth.errors';

const RegisterBodySchema = z.object({
  username: z.string().trim().min(3).max(64),
  email: z.string().trim().email(),
  password: z.string().min(8).max(256),
  role: z.enum(['admin', 'staff']),
});

const LoginBodySchema = z.object({
  usernameOrEmail: z.string().trim().min(1).max(256),
  password: z.string().min(1).max(256),
});

const LogoutBodySchema = z.object({
  refreshToken: z.string().trim().min(1),
});

@Controller(HTTP_API_V1_AUTH_PATH)
export class AuthV1RestController {
  constructor(@Inject(KeycloakAuthService) private readonly keycloak: KeycloakAuthService) {}

  @Post('register')
  async register(@Body() body: unknown): Promise<{ created: true; userId?: string }> {
    try {
      const parsed = RegisterBodySchema.parse(body);
      const res = await this.keycloak.registerUser(parsed);
      // Dev-only: returning userId makes diagnosing Keycloak required-actions issues easier.
      if ((process.env.NODE_ENV ?? '').toLowerCase() !== 'production') {
        return { created: true, userId: res.userId };
      }
      return { created: true };
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw restHttpException(400, 'VALIDATION', 'Invalid request', err.flatten());
      }
      if (err instanceof MisconfigError) {
        logErrorDev('[auth.register] misconfig', undefined, err);
        throw restHttpException(500, 'MISCONFIG', 'Registration failed', { message: err.message });
      }
      if (err instanceof InvalidRoleError) {
        throw restHttpException(400, 'INVALID_ROLE', 'Invalid role', { role: err.role });
      }
      if (err instanceof KeycloakConflictError) {
        throw restHttpException(409, 'CONFLICT', err.message, err.details);
      }
      if (err instanceof KeycloakUnreachableError) {
        logErrorDev('[auth.register] keycloak unreachable', undefined, err);
        throw restHttpException(502, 'KEYCLOAK_UNREACHABLE', 'Registration failed', devErrorDetails(err));
      }
      if (err instanceof KeycloakBadResponseError) {
        logErrorDev('[auth.register] keycloak bad response', { status: err.status }, err);
        throw restHttpException(502, 'KEYCLOAK_BAD_RESPONSE', 'Registration failed', { status: err.status, body: err.body });
      }
      if (err instanceof KeycloakForbiddenError) {
        logErrorDev('[auth.register] keycloak forbidden', { step: err.step }, err);
        throw restHttpException(502, 'KEYCLOAK_FORBIDDEN', 'Registration failed', { status: err.status, step: err.step, body: err.body });
      }
      if (err instanceof HttpException) {
        throw err;
      }
      logErrorDev('[auth.register] failed', undefined, err);
      throw restHttpException(500, 'INTERNAL', 'Registration failed', devErrorDetails(err));
    }
  }

  @Post('login')
  async login(@Body() body: unknown): Promise<{
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresIn?: number;
    refreshExpiresIn?: number;
    tokenType?: string;
    scope?: string;
  }> {
    try {
      const parsed = LoginBodySchema.parse(body);
      const clientId = (process.env.KEYCLOAK_CLIENT_ID ?? 'topcv-api').trim() || 'topcv-api';
      const tokens = await this.keycloak.loginWithPasswordGrant({ ...parsed, clientId });
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
      if (err instanceof z.ZodError) {
        throw restHttpException(400, 'VALIDATION', 'Invalid request', err.flatten());
      }
      if (err instanceof KeycloakAccountNotReadyError) {
        throw restHttpException(
          409,
          'ACCOUNT_NOT_READY',
          'Account is not fully set up. Please complete any required actions in Keycloak or contact support.',
          err.details,
        );
      }
      logErrorDev('[auth.login] failed', undefined, err);
      throw restHttpException(401, 'INVALID_CREDENTIALS', 'Invalid credentials', devErrorDetails(err));
    }
  }

  @Post('logout')
  async logout(@Body() body: unknown): Promise<{ loggedOut: true }> {
    try {
      const parsed = LogoutBodySchema.parse(body);
      const clientId = (process.env.KEYCLOAK_CLIENT_ID ?? 'topcv-api').trim() || 'topcv-api';
      await this.keycloak.logoutWithRefreshToken({ refreshToken: parsed.refreshToken, clientId });
      return { loggedOut: true };
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw restHttpException(400, 'VALIDATION', 'Invalid request', err.flatten());
      }
      logErrorDev('[auth.logout] failed', undefined, err);
      throw restHttpException(401, 'LOGOUT_FAILED', 'Logout failed');
    }
  }
}

