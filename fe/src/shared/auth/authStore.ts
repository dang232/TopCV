export type { AuthSession } from './session/types';

import type { AuthSession } from './session/types';
import {
  clearSession,
  getAccessTokenFromSessionStore,
  readSessionSnapshot,
  subscribeToSessionChanges,
  writeSession,
} from './session/store';

type Listener = () => void;

export function readStoredSession(): AuthSession | null {
  return readSessionSnapshot();
}

export function writeStoredSession(session: AuthSession) {
  writeSession(session);
}

export function clearStoredSession() {
  clearSession();
}

export function subscribeToSession(listener: Listener) {
  return subscribeToSessionChanges(listener);
}

export function getAccessTokenFromStorage(): string | null {
  return getAccessTokenFromSessionStore();
}

