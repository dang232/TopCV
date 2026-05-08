import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthSession } from './session/types';
import { refreshAccessTokenSingleFlight, shouldAttempt401Refresh } from './sessionRefresh';

let storedSession: AuthSession | null = null;

vi.mock('@/src/shared/config/publicEnv', () => ({
  getPublicEnv: () => ({
    apiBaseUrl: 'https://api.example.test',
    keycloakUrl: '',
    keycloakRealm: '',
    keycloakClientId: '',
  }),
}));

vi.mock('./authStore', () => ({
  readStoredSession: vi.fn(() => storedSession),
  writeStoredSession: vi.fn((session: AuthSession) => {
    storedSession = session;
  }),
  clearStoredSession: vi.fn(() => {
    storedSession = null;
  }),
}));

function mockSession(): AuthSession {
  return {
    accessToken: 'old-access-token',
    refreshToken: 'refresh-token',
    roles: [],
  };
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('refreshAccessTokenSingleFlight', () => {
  beforeEach(() => {
    storedSession = mockSession();
    vi.restoreAllMocks();
  });

  it('accepts explicit success envelope refresh responses', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: 'success',
        data: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token', expiresIn: 3600 },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshAccessTokenSingleFlight()).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/v1/auth/refresh', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
    });
    expect(storedSession).toMatchObject({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      roles: [],
    });
  });

  it('accepts plain refresh responses for backward compatibility', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ accessToken: 'plain-access-token', expiresIn: 3600 })),
    );

    await expect(refreshAccessTokenSingleFlight()).resolves.toBe(true);

    expect(storedSession).toMatchObject({
      accessToken: 'plain-access-token',
      refreshToken: 'refresh-token',
      roles: [],
    });
  });

  it('clears session when refresh fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'Unauthorized' }, { status: 401 })));

    await expect(refreshAccessTokenSingleFlight()).resolves.toBe(false);

    expect(storedSession).toBeNull();
  });

  it('shares one refresh request across concurrent callers', async () => {
    let resolveFetch!: (response: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn(() => fetchPromise);
    vi.stubGlobal('fetch', fetchMock);

    const first = refreshAccessTokenSingleFlight();
    const second = refreshAccessTokenSingleFlight();
    resolveFetch(jsonResponse({ status: 'success', data: { accessToken: 'shared-access-token' } }));

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(storedSession).toMatchObject({
      accessToken: 'shared-access-token',
      refreshToken: 'refresh-token',
    });
  });
});

describe('shouldAttempt401Refresh', () => {
  beforeEach(() => {
    storedSession = mockSession();
  });

  it('does not retry the refresh endpoint when query params are present', () => {
    expect(shouldAttempt401Refresh('/auth/refresh?x=1')).toBe(false);
  });
});
