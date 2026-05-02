'use client';

import { API_V1 } from '@/src/shared/api/http/constants';
import { getPublicEnv } from '@/src/shared/config/publicEnv';

import { buildAuthSessionFromRestTokens } from './buildAuthSessionFromRestTokens';
import { clearStoredSession, readStoredSession, writeStoredSession } from './authStore';
import { isAccessNearExpiry } from './jwt';

const PROACTIVE_REFRESH_SKEW_MS = 60_000;

let refreshChain: Promise<boolean> | null = null;

/**
 * Single-flight Keycloak refresh via Nest `POST /auth/refresh`.
 * Returns true if a new access token was written; false if no refresh token or refresh failed.
 */
export async function refreshAccessTokenSingleFlight(): Promise<boolean> {
  if (refreshChain) return refreshChain;

  refreshChain = (async () => {
    const session = readStoredSession();
    const rt = session?.refreshToken;
    if (!rt) return false;

    try {
      const origin = getPublicEnv().apiBaseUrl.replace(/\/$/, '');
      const res = await fetch(`${origin}${API_V1}/auth/refresh`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });

      if (!res.ok) {
        clearStoredSession();
        return false;
      }

      const json = (await res.json()) as {
        accessToken: string;
        refreshToken?: string;
        idToken?: string;
        expiresIn?: number;
      };

      writeStoredSession(buildAuthSessionFromRestTokens(json, rt));
      return true;
    } catch {
      clearStoredSession();
      return false;
    } finally {
      refreshChain = null;
    }
  })();

  return refreshChain;
}

/** Before API calls: refresh once if access token is near expiry and a refresh token exists. */
export async function ensureSessionAccessTokenFresh(): Promise<void> {
  const s = readStoredSession();
  if (!s?.refreshToken || !s.accessToken) return;
  if (!isAccessNearExpiry(s, PROACTIVE_REFRESH_SKEW_MS)) return;
  await refreshAccessTokenSingleFlight();
}

export function shouldAttempt401Refresh(requestPath: string): boolean {
  const rel = requestPath.startsWith('/') ? requestPath : `/${requestPath}`;
  const q = rel.indexOf('?');
  const base = q === -1 ? rel : rel.slice(0, q);
  if (base === '/auth/login' || base === '/auth/register' || base === '/auth/refresh') return false;
  return Boolean(readStoredSession()?.refreshToken);
}
