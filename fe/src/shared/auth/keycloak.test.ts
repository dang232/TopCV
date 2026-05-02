import { describe, expect, it } from 'vitest';

import { buildKeycloakAuthorizationUrl, sanitizeReturnToPath } from './keycloak';

describe('buildKeycloakAuthorizationUrl', () => {
  it('builds a PKCE auth URL for login', () => {
    const url = buildKeycloakAuthorizationUrl({
      cfg: { baseUrl: 'http://localhost:8080', realm: 'topcv', clientId: 'topcv-api' },
      redirectUri: 'http://localhost:3000/auth/callback',
      challenge: 'challenge',
      state: 'state',
      action: 'login',
      loginHint: 'user@example.com',
    });

    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/realms/topcv/protocol/openid-connect/auth');
    expect(parsed.searchParams.get('client_id')).toBe('topcv-api');
    expect(parsed.searchParams.get('redirect_uri')).toBe('http://localhost:3000/auth/callback');
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('scope')).toContain('openid');
    expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
    expect(parsed.searchParams.get('code_challenge')).toBe('challenge');
    expect(parsed.searchParams.get('state')).toBe('state');
    expect(parsed.searchParams.get('kc_action')).toBeNull();
    expect(parsed.searchParams.get('login_hint')).toBe('user@example.com');
  });

  it('adds register trigger params for registration', () => {
    const url = buildKeycloakAuthorizationUrl({
      cfg: { baseUrl: 'http://localhost:8080', realm: 'topcv', clientId: 'topcv-api' },
      redirectUri: 'http://localhost:3000/auth/callback',
      challenge: 'challenge',
      state: 'state',
      action: 'register',
      loginHint: 'user@example.com',
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get('kc_action')).toBe('register');
    expect(parsed.searchParams.get('prompt')).toBeNull();
    expect(parsed.searchParams.get('screen_hint')).toBe('signup');
    expect(parsed.searchParams.get('login_hint')).toBe('user@example.com');
  });
});

describe('sanitizeReturnToPath', () => {
  it('allows app-relative paths', () => {
    expect(sanitizeReturnToPath('/dashboard')).toBe('/dashboard');
    expect(sanitizeReturnToPath('/forms?page=1#top')).toBe('/forms?page=1#top');
  });

  it('normalizes missing leading slash', () => {
    expect(sanitizeReturnToPath('dashboard')).toBe('/dashboard');
  });

  it('blocks absolute and protocol-relative URLs', () => {
    expect(sanitizeReturnToPath('https://evil.example/phish', '/dashboard')).toBe('/dashboard');
    expect(sanitizeReturnToPath('//evil.example/phish', '/dashboard')).toBe('/dashboard');
  });
});

