'use client';

import React, { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { TOPCV_REALM_ROLES } from '@topcv/shared/auth';

import { clearStoredSession, readStoredSession, subscribeToSession, writeStoredSession, type AuthSession } from './authStore';
import { ApiHttpError, apiFetchJson } from '@/src/shared/api/http/apiClient';
import { extractRolesFromToken } from './jwt';
import { logErrorDev } from '@/src/shared/logging/logger';
import { normalizeRoles } from './roles';

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  roles: string[];
  login: (input: { usernameOrEmail: string; password: string; returnTo?: string }) => Promise<void>;
  register: (input: { username: string; email: string; password: string; returnTo?: string }) => Promise<void>;
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
          // Prefer backend-provided message (e.g. 409 ACCOUNT_NOT_READY).
          if (err.message) throw new Error(err.message);
          throw new Error(`Login failed (${err.status})`);
        }
        throw new Error('Login failed');
      }

      // Keycloak roles are reliably present on the access token (`realm_access`, `resource_access`).
      // The ID token often omits those claims, which would make the UI think the user has no roles.
      const tokenForRoles = res.accessToken || res.idToken;
      const expiresAtEpochMs =
        typeof res.expiresIn === 'number' && res.expiresIn > 0 ? Date.now() + res.expiresIn * 1000 : undefined;

      const extractedRoles = extractRolesFromToken(tokenForRoles ?? '', process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID);

      writeStoredSession({
        accessToken: res.accessToken,
        idToken: res.idToken,
        expiresAtEpochMs,
        roles: normalizeRoles(extractedRoles),
      });
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
              role: TOPCV_REALM_ROLES[1],
            },
          });
        } catch (err) {
          logErrorDev('[auth.register] request failed', undefined, err);
          if (err instanceof ApiHttpError && err.message) {
            throw new Error(err.message);
          }
          throw new Error('Registration failed');
        }
        await doLogin({ usernameOrEmail: input.email, password: input.password, returnTo: input.returnTo });
      },
      logout: () => {
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

