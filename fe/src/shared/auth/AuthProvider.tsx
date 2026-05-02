'use client';

import React, { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { DEFAULT_SELF_REGISTER_ROLE } from '@topcv/shared/auth';
import type { TopcvRealmRole } from '@topcv/shared/auth';

import { buildAuthSessionFromRestTokens } from './buildAuthSessionFromRestTokens';
import { clearStoredSession, readStoredSession, subscribeToSession, writeStoredSession, type AuthSession } from './authStore';
import { API_V1 } from '@/src/shared/api/http/constants';
import { ApiHttpError, apiFetchJson } from '@/src/shared/api/http/apiClient';
import { getPublicEnv } from '@/src/shared/config/publicEnv';
import { logErrorDev } from '@/src/shared/logging/logger';
import { normalizeRoles } from './roles';

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  roles: string[];
  login: (input: { usernameOrEmail: string; password: string; returnTo?: string }) => Promise<void>;
  register: (input: { username: string; email: string; password: string; role?: TopcvRealmRole; returnTo?: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getSnapshot() {
  return readStoredSession();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = useSyncExternalStore(subscribeToSession, getSnapshot, () => null);

  const value = useMemo<AuthContextValue>(() => {
    const roles = normalizeRoles(session?.roles);

    const doLogin: AuthContextValue['login'] = async (input) => {
      let res: {
        accessToken: string;
        refreshToken?: string;
        idToken?: string;
        expiresIn?: number;
      };
      try {
        res = await apiFetchJson('/auth/login', {
          method: 'POST',
          json: {
            usernameOrEmail: input.usernameOrEmail,
            password: input.password,
          },
        });
      } catch (err) {
        logErrorDev('[auth.login] request failed', undefined, err);
        if (err instanceof ApiHttpError) {
          if (err.message) throw new Error(err.message);
          throw new Error(`Sign-in failed (${err.status}).`);
        }
        if (err instanceof TypeError && /fetch|network/i.test(String(err.message))) {
          throw new Error('Unable to reach the server. Check your connection and that the API is running.');
        }
        throw new Error('Sign-in failed.');
      }

      writeStoredSession(buildAuthSessionFromRestTokens(res));
    };

    return {
      session,
      isAuthenticated: Boolean(session?.accessToken),
      roles,
      login: doLogin,
      register: async (input) => {
        try {
          await apiFetchJson('/auth/register', {
            method: 'POST',
            json: {
              username: input.username,
              email: input.email,
              password: input.password,
              role: input.role ?? DEFAULT_SELF_REGISTER_ROLE,
            },
          });
        } catch (err) {
          logErrorDev('[auth.register] request failed', undefined, err);
          if (err instanceof ApiHttpError && err.message) {
            throw new Error(err.message);
          }
          if (err instanceof TypeError && /fetch|network/i.test(String(err.message))) {
            throw new Error('Unable to reach the server. Check your connection and that the API is running.');
          }
          throw new Error('Registration failed.');
        }
        await doLogin({ usernameOrEmail: input.email, password: input.password, returnTo: input.returnTo });
      },
      logout: () => {
        const snap = readStoredSession();
        const rt = snap?.refreshToken;
        if (typeof window !== 'undefined' && rt) {
          const origin = getPublicEnv().apiBaseUrl.replace(/\/$/, '');
          void fetch(`${origin}${API_V1}/auth/logout`, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rt }),
          });
        }
        clearStoredSession();
      },
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

