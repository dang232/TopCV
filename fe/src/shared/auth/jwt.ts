function base64UrlToBase64(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return padded;
}

export function parseJwt<T = unknown>(token: string): T | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const json = atob(base64UrlToBase64(parts[1]));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** JWT `exp` claim is seconds since Unix epoch; returns milliseconds for comparison with `Date.now()`. */
export function getJwtExpiryEpochMs(token: string): number | undefined {
  const payload = parseJwt<{ exp?: number }>(token);
  if (!payload || typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return undefined;
  return payload.exp * 1000;
}

/** Minimal session shape for expiry checks (same fields as stored `AuthSession` for TTL). */
export type SessionExpiryFields = {
  accessToken: string;
  expiresAtEpochMs?: number;
};

/** True when the access token should be treated as expired. Missing `exp` / `expiresAt` => not expired (server 401 still applies). */
export function isSessionExpired(session: SessionExpiryFields | null): boolean {
  if (!session?.accessToken) return false;
  const now = Date.now();
  if (typeof session.expiresAtEpochMs === 'number' && Number.isFinite(session.expiresAtEpochMs)) {
    return now >= session.expiresAtEpochMs;
  }
  const jwtMs = getJwtExpiryEpochMs(session.accessToken);
  if (jwtMs !== undefined) return now >= jwtMs;
  return false;
}

/** True when access token is missing `exp` / TTL data, or is within `skewMs` of expiry (proactive refresh). */
export function isAccessNearExpiry(session: SessionExpiryFields, skewMs: number): boolean {
  if (!session.accessToken) return false;
  const now = Date.now();
  let end: number | undefined;
  if (typeof session.expiresAtEpochMs === 'number' && Number.isFinite(session.expiresAtEpochMs)) {
    end = session.expiresAtEpochMs;
  } else {
    end = getJwtExpiryEpochMs(session.accessToken);
  }
  if (end === undefined) return false;
  return now >= end - skewMs;
}

export function extractRolesFromToken(token: string, clientId?: string): string[] {
  const payload = parseJwt<unknown>(token);
  if (!payload) return [];
  if (typeof payload !== 'object' || payload === null) return [];
  const obj = payload as Record<string, unknown>;

  const roles = new Set<string>();
  const realmAccess = obj['realm_access'];
  const realmRoles: unknown =
    typeof realmAccess === 'object' && realmAccess !== null ? (realmAccess as Record<string, unknown>)['roles'] : undefined;
  if (Array.isArray(realmRoles)) {
    for (const r of realmRoles) if (typeof r === 'string') roles.add(r);
  }

  const resourceAccess = obj['resource_access'];
  const resourceRoles: unknown =
    clientId && typeof resourceAccess === 'object' && resourceAccess !== null
      ? ((resourceAccess as Record<string, unknown>)[clientId] as Record<string, unknown> | undefined)?.['roles']
      : undefined;
  if (Array.isArray(resourceRoles)) {
    for (const r of resourceRoles) if (typeof r === 'string') roles.add(r);
  }

  return [...roles];
}

