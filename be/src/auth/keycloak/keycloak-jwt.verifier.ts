import { createRemoteJWKSet, jwtVerify } from 'jose';

import type { AuthUser } from '../auth.types';
import { mapToDomainRoles } from '../roles/role-mapping';
import type { KeycloakAccess } from './keycloak-claims.types';
import { defaultJwksUrl, extractKeycloakRoles, normalizeIssuer } from './keycloak-jwks';

export class KeycloakJwtVerifier {
  private remoteJwks?: ReturnType<typeof createRemoteJWKSet>;

  async verifyAuthorizationHeader(authHeader: string | undefined): Promise<AuthUser | null> {
    const header = authHeader?.trim();
    if (!header) return null;

    const [scheme, token] = header.split(/\s+/, 2);
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

    const issuer = process.env.KEYCLOAK_ISSUER?.trim();
    if (!issuer) return null;

    const jwksUrl = (process.env.KEYCLOAK_JWKS_URL ?? defaultJwksUrl(issuer)).trim();
    const audience = process.env.KEYCLOAK_AUDIENCE?.trim();

    if (!this.remoteJwks) {
      this.remoteJwks = createRemoteJWKSet(new URL(jwksUrl));
    }

    const { payload } = await jwtVerify(token, this.remoteJwks, {
      issuer: normalizeIssuer(issuer),
      audience: audience || undefined,
    });

    const clientId = process.env.KEYCLOAK_CLIENT_ID?.trim();
    const rawRoles = extractKeycloakRoles(payload, clientId || undefined);

    const sub = payload.sub;
    if (!sub) return null;

    return {
      sub,
      preferredUsername: (payload as unknown as KeycloakAccess).preferred_username,
      rawRoles,
      roles: mapToDomainRoles(rawRoles),
    };
  }
}
