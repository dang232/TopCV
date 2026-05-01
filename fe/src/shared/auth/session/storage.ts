import type { AuthSession } from './types';

const STORAGE_KEY = 'topcv.auth.session.v1';

function safeParseJson(value: string | null): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function coerceSession(raw: unknown): AuthSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Partial<AuthSession>;
  if (!obj.accessToken || typeof obj.accessToken !== 'string') return null;
  const roles = Array.isArray(obj.roles) ? obj.roles.filter((r) => typeof r === 'string') : [];
  return {
    accessToken: obj.accessToken,
    idToken: typeof obj.idToken === 'string' ? obj.idToken : undefined,
    expiresAtEpochMs: typeof obj.expiresAtEpochMs === 'number' ? obj.expiresAtEpochMs : undefined,
    roles,
  };
}

export function readSessionFromLocalStorage(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = safeParseJson(window.localStorage.getItem(STORAGE_KEY));
  return coerceSession(raw);
}

export function writeSessionToLocalStorage(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSessionLocalStorage(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getSessionStorageKey(): string {
  return STORAGE_KEY;
}

