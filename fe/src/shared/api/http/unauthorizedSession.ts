import { clearStoredSession } from '@/src/shared/auth/authStore';

/**
 * REST paths where HTTP 401 is an expected credential outcome — never clear session.
 */
const AUTH_401_NO_SESSION_CLEAR_PATHS = new Set(['/auth/login', '/auth/register']);

/** POST paths that must not attach `Authorization: Bearer` (body carries credentials / refresh). */
const AUTH_POST_NO_BEARER_PATHS = new Set(['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']);

function normalizeRequestPath(path: string): string {
  const rel = path.startsWith('/') ? path : `/${path}`;
  const q = rel.indexOf('?');
  return q === -1 ? rel : rel.slice(0, q);
}

function isAuth401NoSessionClearPath(path: string): boolean {
  return AUTH_401_NO_SESSION_CLEAR_PATHS.has(normalizeRequestPath(path));
}

/**
 * Credential / refresh POSTs must not send a stale Bearer token (would confuse debugging and
 * could interact badly with any gateway auth).
 */
export function shouldAttachBearerForApiRequest(path: string, init: RequestInit): boolean {
  const method = (init.method ?? 'GET').toUpperCase();
  if (method !== 'POST') return true;
  const p = normalizeRequestPath(path);
  return !AUTH_POST_NO_BEARER_PATHS.has(p);
}

let sessionClearFromUnauthorizedInFlight = false;

/**
 * Clears the client session on API 401 so `RequireAuth` can soft-redirect to login.
 * Does not clear on auth credential POST failures (`/auth/login`, `/auth/register`).
 *
 * Intentionally no `location.assign`: a hard navigation races Next.js RSC fetches for
 * `/dashboard` (red aborted rows) and doubles with `RequireAuth`'s `router.replace`.
 */
export function clearSessionOnUnauthorizedApiResponse(requestPath: string): void {
  if (isAuth401NoSessionClearPath(requestPath)) return;
  if (sessionClearFromUnauthorizedInFlight) return;
  sessionClearFromUnauthorizedInFlight = true;
  try {
    clearStoredSession();
  } finally {
    queueMicrotask(() => {
      sessionClearFromUnauthorizedInFlight = false;
    });
  }
}
