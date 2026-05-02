import { extractRolesFromToken, getJwtExpiryEpochMs } from './jwt';
import { normalizeRoles } from './roles';
import type { AuthSession } from './session/types';

/** Shape returned by `POST /auth/login` and `POST /auth/refresh` (camelCase). */
export type RestAuthTokenPayload = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
};

export function buildAuthSessionFromRestTokens(res: RestAuthTokenPayload, refreshFallback?: string): AuthSession {
  let expiresAtEpochMs: number | undefined =
    typeof res.expiresIn === 'number' && res.expiresIn > 0 ? Date.now() + res.expiresIn * 1000 : undefined;
  if (expiresAtEpochMs === undefined) {
    const fromJwt = getJwtExpiryEpochMs(res.accessToken);
    if (fromJwt !== undefined) expiresAtEpochMs = fromJwt;
  }
  const tokenForRoles = res.accessToken || res.idToken;
  const roles = normalizeRoles(
    extractRolesFromToken(tokenForRoles ?? '', process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID),
  );
  return {
    accessToken: res.accessToken,
    refreshToken: res.refreshToken ?? refreshFallback,
    idToken: res.idToken,
    expiresAtEpochMs,
    roles,
  };
}
