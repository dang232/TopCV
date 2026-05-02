import { afterEach, describe, expect, it, vi } from 'vitest';

import { KeycloakAuthService } from './keycloak-auth.service';
import {
  InvalidCredentialsError,
  InvalidRoleError,
  KeycloakConflictError,
  KeycloakForbiddenError,
  KeycloakUnreachableError,
  MisconfigError,
} from './keycloak-auth.errors';
import { jsonResponse, textResponse } from '../../shared/testing/http';

describe(KeycloakAuthService.name, () => {
  const prevEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...prevEnv };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('registerUser uses admin API to create user, set password, assign realm role', async () => {
    process.env.KEYCLOAK_ISSUER = 'http://localhost:8080/realms/topcv';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'topcv-bff';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';

    const calledUrls: string[] = [];
    let requiredActions: string[] = ['UPDATE_PROFILE'];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input instanceof Request
              ? input.url
              : String(input);
      calledUrls.push(url);
      const method = (init?.method ?? 'GET').toUpperCase();

      if (url.endsWith('/protocol/openid-connect/token')) {
        return jsonResponse({ access_token: 'admin-token' });
      }
      if (url.endsWith('/admin/realms/topcv/users')) {
        return jsonResponse(undefined, { status: 201, headers: { location: 'http://localhost:8080/admin/realms/topcv/users/u1' } });
      }
      if (url.endsWith('/admin/realms/topcv/users/u1')) {
        // GET (read user) then PUT (update required actions); repeated GETs may happen for final checks.
        if (method === 'GET') {
          return jsonResponse({ id: 'u1', requiredActions, enabled: true, emailVerified: false }, { status: 200 });
        }
        requiredActions = [];
        return new Response(null, { status: 204 });
      }
      if (url.endsWith('/admin/realms/topcv/users/u1/reset-password')) {
        return new Response(null, { status: 204 });
      }
      if (url.endsWith('/admin/realms/topcv/roles/staff')) {
        return jsonResponse({ id: 'r1', name: 'staff' });
      }
      if (url.endsWith('/admin/realms/topcv/users/u1/role-mappings/realm')) {
        return new Response(null, { status: 204 });
      }
      return textResponse('not found', { status: 404 });
    });

    vi.stubGlobal('fetch', fetchMock);

    const svc = new KeycloakAuthService();
    await svc.registerUser({ username: 'bob', email: 'bob@example.com', password: 'Password1!', role: 'staff' });

    expect(fetchMock).toHaveBeenCalled();
    expect(calledUrls).toEqual(
      expect.arrayContaining([
        'http://localhost:8080/realms/topcv/protocol/openid-connect/token',
        'http://localhost:8080/admin/realms/topcv/users',
        'http://localhost:8080/admin/realms/topcv/users/u1',
        'http://localhost:8080/admin/realms/topcv/users/u1/reset-password',
        'http://localhost:8080/admin/realms/topcv/roles/staff',
        'http://localhost:8080/admin/realms/topcv/users/u1/role-mappings/realm',
      ]),
    );
  });

  it('loginWithPasswordGrant calls token endpoint with password grant', async () => {
    process.env.KEYCLOAK_ISSUER = 'http://localhost:8080/auth/realms/topcv';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'topcv-bff';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';

    let lastUrl: string | null = null;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      lastUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input instanceof Request
              ? input.url
              : String(input);
      return jsonResponse({ access_token: 'at', refresh_token: 'rt', expires_in: 60 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const svc = new KeycloakAuthService();
    const res = await svc.loginWithPasswordGrant({ usernameOrEmail: 'bob', password: 'pass', clientId: 'topcv-api' });

    expect(res.access_token).toBe('at');
    expect(fetchMock).toHaveBeenCalled();
    expect(lastUrl).toBe('http://localhost:8080/auth/realms/topcv/protocol/openid-connect/token');
  });

  it('refreshWithRefreshTokenGrant posts refresh_token grant', async () => {
    process.env.KEYCLOAK_ISSUER = 'http://localhost:8080/auth/realms/topcv';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'topcv-bff';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';

    let body = '';
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const b = init?.body;
      body = b instanceof URLSearchParams ? b.toString() : typeof b === 'string' ? b : '';
      return jsonResponse({ access_token: 'at2', refresh_token: 'rt2', expires_in: 300 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const svc = new KeycloakAuthService();
    const res = await svc.refreshWithRefreshTokenGrant({ refreshToken: 'old-rt', clientId: 'topcv-api' });

    expect(res.access_token).toBe('at2');
    expect(res.refresh_token).toBe('rt2');
    expect(body).toContain('grant_type=refresh_token');
    expect(body).toContain('refresh_token=old-rt');
    expect(body).toContain('client_id=topcv-api');
  });

  it('loginWithPasswordGrant throws InvalidCredentialsError on invalid_grant', async () => {
    process.env.KEYCLOAK_ISSUER = 'http://localhost:8080/realms/topcv';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'topcv-bff';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          { error: 'invalid_grant', error_description: 'Invalid user credentials' },
          { status: 400 },
        ),
      ),
    );

    const svc = new KeycloakAuthService();
    await expect(svc.loginWithPasswordGrant({ usernameOrEmail: 'bob', password: 'wrong', clientId: 'topcv-api' })).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it('registerUser throws MisconfigError when admin env missing', async () => {
    process.env.KEYCLOAK_ISSUER = 'http://localhost:8080/realms/topcv';
    delete process.env.KEYCLOAK_ADMIN_CLIENT_ID;
    delete process.env.KEYCLOAK_ADMIN_CLIENT_SECRET;

    const svc = new KeycloakAuthService();
    await expect(svc.registerUser({ username: 'bob', email: 'bob@example.com', password: 'Password1!', role: 'staff' })).rejects.toBeInstanceOf(
      MisconfigError,
    );
  });

  it('registerUser throws KeycloakConflictError when user exists', async () => {
    process.env.KEYCLOAK_ISSUER = 'http://localhost:8080/realms/topcv';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'topcv-bff';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      if (url.endsWith('/protocol/openid-connect/token')) return jsonResponse({ access_token: 'admin-token' });
      if (url.endsWith('/admin/realms/topcv/users')) return textResponse('exists', { status: 409 });
      return textResponse('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const svc = new KeycloakAuthService();
    await expect(svc.registerUser({ username: 'bob', email: 'bob@example.com', password: 'Password1!', role: 'staff' })).rejects.toBeInstanceOf(
      KeycloakConflictError,
    );
  });

  it('registerUser throws InvalidRoleError when role not found', async () => {
    process.env.KEYCLOAK_ISSUER = 'http://localhost:8080/realms/topcv';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'topcv-bff';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      if (url.endsWith('/protocol/openid-connect/token')) return jsonResponse({ access_token: 'admin-token' });
      if (url.endsWith('/admin/realms/topcv/users'))
        return jsonResponse(undefined, { status: 201, headers: { location: 'http://localhost:8080/admin/realms/topcv/users/u1' } });
      if (url.endsWith('/admin/realms/topcv/users/u1')) {
        if (method === 'GET') return jsonResponse({ id: 'u1', requiredActions: ['UPDATE_PROFILE'] }, { status: 200 });
        return new Response(null, { status: 204 });
      }
      if (url.endsWith('/admin/realms/topcv/users/u1/reset-password')) return new Response(null, { status: 204 });
      if (url.endsWith('/admin/realms/topcv/roles/staff')) return textResponse('missing role', { status: 404 });
      return textResponse('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const svc = new KeycloakAuthService();
    await expect(svc.registerUser({ username: 'bob', email: 'bob@example.com', password: 'Password1!', role: 'staff' })).rejects.toBeInstanceOf(
      InvalidRoleError,
    );
  });

  it('registerUser rolls back created user when later step fails', async () => {
    process.env.KEYCLOAK_ISSUER = 'http://localhost:8080/realms/topcv';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'topcv-bff';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';

    const calledUrls: string[] = [];
    const calledMethods: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input instanceof Request
              ? input.url
              : String(input);
      calledUrls.push(url);
      calledMethods.push((init?.method ?? 'GET').toUpperCase());

      if (url.endsWith('/protocol/openid-connect/token')) {
        return jsonResponse({ access_token: 'admin-token' });
      }
      if (url.endsWith('/admin/realms/topcv/users') && (init?.method ?? 'GET').toUpperCase() === 'POST') {
        return jsonResponse(undefined, { status: 201, headers: { location: 'http://localhost:8080/admin/realms/topcv/users/u1' } });
      }
      if (url.endsWith('/admin/realms/topcv/users/u1') && (init?.method ?? 'GET').toUpperCase() === 'GET') {
        return jsonResponse({ id: 'u1', requiredActions: ['UPDATE_PROFILE'], enabled: true, emailVerified: false }, { status: 200 });
      }
      if (url.endsWith('/admin/realms/topcv/users/u1') && (init?.method ?? 'GET').toUpperCase() === 'PUT') {
        return new Response(null, { status: 204 });
      }
      if (url.endsWith('/admin/realms/topcv/users/u1/reset-password')) {
        return new Response(null, { status: 204 });
      }
      if (url.endsWith('/admin/realms/topcv/roles/staff')) {
        return jsonResponse({ id: 'r1', name: 'staff' });
      }
      if (url.endsWith('/admin/realms/topcv/users/u1/role-mappings/realm')) {
        return textResponse('forbidden', { status: 403 });
      }
      if (url.endsWith('/admin/realms/topcv/users/u1') && (init?.method ?? 'GET').toUpperCase() === 'DELETE') {
        return new Response(null, { status: 204 });
      }
      return textResponse('not found', { status: 404 });
    });

    vi.stubGlobal('fetch', fetchMock);

    const svc = new KeycloakAuthService();
    await expect(svc.registerUser({ username: 'bob', email: 'bob@example.com', password: 'Password1!', role: 'staff' })).rejects.toBeInstanceOf(
      KeycloakForbiddenError,
    );

    // Ensure rollback delete was attempted.
    const pairs = calledUrls.map((u, i) => `${calledMethods[i]} ${u}`);
    expect(pairs).toEqual(
      expect.arrayContaining([
        'DELETE http://localhost:8080/admin/realms/topcv/users/u1',
        'POST http://localhost:8080/admin/realms/topcv/users/u1/role-mappings/realm',
      ]),
    );
  });

  it('registerUser throws KeycloakUnreachableError when fetch throws', async () => {
    process.env.KEYCLOAK_ISSUER = 'http://localhost:8080/realms/topcv';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'topcv-bff';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );

    const svc = new KeycloakAuthService();
    await expect(svc.registerUser({ username: 'bob', email: 'bob@example.com', password: 'Password1!', role: 'staff' })).rejects.toBeInstanceOf(
      KeycloakUnreachableError,
    );
  });

  it('registerUser deletes user if required actions cannot be cleared', async () => {
    process.env.KEYCLOAK_ISSUER = 'http://localhost:8080/realms/topcv';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'topcv-bff';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';

    const called: string[] = [];
    let getCount = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input instanceof Request
              ? input.url
              : String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      called.push(`${method} ${url}`);

      if (url.endsWith('/protocol/openid-connect/token')) return jsonResponse({ access_token: 'admin-token' });
      if (url.endsWith('/admin/realms/topcv/users') && method === 'POST') {
        return jsonResponse(undefined, { status: 201, headers: { location: 'http://localhost:8080/admin/realms/topcv/users/u1' } });
      }
      if (url.endsWith('/admin/realms/topcv/users/u1') && method === 'GET') {
        getCount += 1;
        // Always report requiredActions present even after PUT; simulates realm forcing defaults.
        return jsonResponse({ id: 'u1', requiredActions: ['UPDATE_PROFILE'], enabled: true, emailVerified: true }, { status: 200 });
      }
      if (url.endsWith('/admin/realms/topcv/users/u1') && method === 'PUT') return new Response(null, { status: 204 });
      if (url.endsWith('/admin/realms/topcv/users/u1/reset-password')) return new Response(null, { status: 204 });
      if (url.endsWith('/admin/realms/topcv/roles/staff')) return jsonResponse({ id: 'r1', name: 'staff' });
      if (url.endsWith('/admin/realms/topcv/users/u1/role-mappings/realm')) return new Response(null, { status: 204 });
      if (url.endsWith('/admin/realms/topcv/users/u1') && method === 'DELETE') return new Response(null, { status: 204 });
      return textResponse('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const svc = new KeycloakAuthService();
    await expect(svc.registerUser({ username: 'bob', email: 'bob@example.com', password: 'Password1!', role: 'staff' })).rejects.toBeTruthy();

    // Ensure we attempted multiple GETs (final verification) and rollback delete.
    expect(getCount).toBeGreaterThanOrEqual(2);
    expect(called).toEqual(expect.arrayContaining(['DELETE http://localhost:8080/admin/realms/topcv/users/u1']));
  });
});

