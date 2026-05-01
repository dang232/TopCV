import type { JWTPayload } from 'jose';

import type { KeycloakAccess } from './keycloak-claims.types';

export function normalizeIssuer(issuer: string): string {
  return issuer.endsWith('/') ? issuer.slice(0, -1) : issuer;
}

export function defaultJwksUrl(issuer: string): string {
  return `${normalizeIssuer(issuer)}/protocol/openid-connect/certs`;
}

export function extractKeycloakRoles(payload: JWTPayload, clientId: string | undefined): string[] {
  const access = payload as unknown as KeycloakAccess;
  const realm = access.realm_access?.roles ?? [];
  const client = clientId ? (access.resource_access?.[clientId]?.roles ?? []) : [];
  return [...new Set([...realm, ...client])];
}
