import { isSessionExpired } from '../jwt';
import type { AuthSession } from './types';
import { clearSessionLocalStorage, getSessionStorageKey, readSessionFromLocalStorage, writeSessionToLocalStorage } from './storage';

type Listener = () => void;

const listeners = new Set<Listener>();

let cachedSession: AuthSession | null = null;
let hasInitialized = false;

function notify() {
  for (const l of listeners) l();
}

function ensureInitialized() {
  if (typeof window === 'undefined') return;
  if (hasInitialized) return;
  cachedSession = readSessionFromLocalStorage();
  hasInitialized = true;
}

function purgeExpiredSessionIfNeeded(): void {
  if (cachedSession === null) return;
  if (!isSessionExpired(cachedSession)) return;
  /** Keep session if refresh can renew access (no BFF — refresh token lives in storage). */
  if (cachedSession.refreshToken) return;
  clearSession();
}

export function readSessionSnapshot(): AuthSession | null {
  ensureInitialized();
  purgeExpiredSessionIfNeeded();
  return cachedSession;
}

export function writeSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  cachedSession = session;
  hasInitialized = true;
  writeSessionToLocalStorage(session);
  notify();
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  cachedSession = null;
  hasInitialized = true;
  clearSessionLocalStorage();
  notify();
}

export function subscribeToSessionChanges(listener: Listener): () => void {
  ensureInitialized();
  listeners.add(listener);

  const onStorage = (e: StorageEvent) => {
    if (e.key !== getSessionStorageKey()) return;
    cachedSession = readSessionFromLocalStorage();
    hasInitialized = true;
    if (cachedSession !== null && isSessionExpired(cachedSession) && !cachedSession.refreshToken) {
      clearSession();
    } else {
      notify();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

export function getAccessTokenFromSessionStore(): string | null {
  return readSessionSnapshot()?.accessToken ?? null;
}

