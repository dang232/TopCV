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

export function readSessionSnapshot(): AuthSession | null {
  ensureInitialized();
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
    notify();
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

