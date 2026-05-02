import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

import type { AuthUser } from '../auth.types';
import { mapToDomainRoles } from '../roles/role-mapping';
import type { KeycloakAccess } from './keycloak-claims.types';
import { defaultJwksUrl, extractKeycloakRoles, normalizeIssuer } from './keycloak-jwks';

export class KeycloakJwtVerifier {
  private remoteJwks?: ReturnType<typeof createRemoteJWKSet>;

  private isLikelyJwksFetchFailure(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;
    const e = err as { name?: unknown; message?: unknown; cause?: unknown };
    const name = typeof e.name === 'string' ? e.name : '';
    const msg = typeof e.message === 'string' ? e.message : '';
    if (name === 'TypeError' && /fetch failed/i.test(msg)) return true;
    if (e.cause && typeof e.cause === 'object') {
      const c = e.cause as { code?: unknown; message?: unknown };
      const code = typeof c.code === 'string' ? c.code : '';
      const cmsg = typeof c.message === 'string' ? c.message : '';
      if (code && /ECONNRESET|ENOTFOUND|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN/.test(code)) return true;
      if (/certificate|tls/i.test(cmsg)) return true;
    }
    return false;
  }

  async verifyAuthorizationHeaderDetailed(authHeader: string | undefined): Promise<{
    user: AuthUser | null;
    outcome:
      | 'missing_authorization'
      | 'invalid_authorization_scheme'
      | 'missing_bearer_token'
      | 'missing_issuer'
      | 'jwks_fetch_failed'
      | 'jwt_invalid'
      | 'jwt_verify_failed'
      | 'ok';
    errorName?: string;
  }> {
    const header = authHeader?.trim();
    if (!header) return { user: null, outcome: 'missing_authorization' };

    const [scheme, token] = header.split(/\s+/, 2);
    if (scheme?.toLowerCase() !== 'bearer') {
      return { user: null, outcome: 'invalid_authorization_scheme' };
    }
    if (!token) return { user: null, outcome: 'missing_bearer_token' };

    const issuer = process.env.KEYCLOAK_ISSUER?.trim();
    if (!issuer) return { user: null, outcome: 'missing_issuer' };

    const jwksUrl = (process.env.KEYCLOAK_JWKS_URL ?? defaultJwksUrl(issuer)).trim();
    const audience = process.env.KEYCLOAK_AUDIENCE?.trim();

    if (!this.remoteJwks) {
      this.remoteJwks = createRemoteJWKSet(new URL(jwksUrl));
    }

    let payload: JWTPayload;
    try {
      const verified = await jwtVerify(token, this.remoteJwks, {
        issuer: normalizeIssuer(issuer),
        audience: audience || undefined,
      });
      payload = verified.payload;
    } catch (err) {
      const errorName = err instanceof Error ? err.name : undefined;
      if (this.isLikelyJwksFetchFailure(err)) {
        return { user: null, outcome: 'jwks_fetch_failed', errorName };
      }
      // Most jose verification errors (expired, invalid signature, claim mismatch, etc.)
      // are safe to bucket as "invalid" without leaking token contents.
      if (typeof errorName === 'string' && /JWT|JWS|JOSE/i.test(errorName)) {
        return { user: null, outcome: 'jwt_invalid', errorName };
      }
      return { user: null, outcome: 'jwt_verify_failed', errorName };
    }

    const clientId = process.env.KEYCLOAK_CLIENT_ID?.trim();
    const rawRoles = extractKeycloakRoles(payload, clientId || undefined);

    const sub = payload.sub;
    if (!sub) return { user: null, outcome: 'jwt_invalid', errorName: 'MissingSub' };

    return {
      user: {
        sub,
        preferredUsername: (payload as unknown as KeycloakAccess).preferred_username,
        rawRoles,
        roles: mapToDomainRoles(rawRoles),
      },
      outcome: 'ok',
    };
  }

  /**
   * Backwards-compatible API used throughout the app and tests.
   * Prefer {@link verifyAuthorizationHeaderDetailed} when you need diagnostic outcomes.
   */
  async verifyAuthorizationHeader(authHeader: string | undefined): Promise<AuthUser | null> {
    const detailed = await this.verifyAuthorizationHeaderDetailed(authHeader);
    return detailed.user;
  }
}
