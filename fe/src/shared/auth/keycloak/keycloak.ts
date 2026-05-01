import { extractRolesFromToken } from '../jwt';
import { getPublicEnv, missingPublicEnvKeys, type PublicEnvKey } from '@/src/shared/config/publicEnv';
import { logInfoDev } from '@/src/shared/logging/logger';

export type KeycloakConfig = {
  baseUrl: string;
  realm: string;
  clientId: string;
};

const PKCE_VERIFIER_KEY = 'topcv.auth.pkce.verifier';
const OIDC_STATE_KEY = 'topcv.auth.oidc.state';

const KEYCLOAK_ENV_KEYS = [
  'NEXT_PUBLIC_KEYCLOAK_URL',
  'NEXT_PUBLIC_KEYCLOAK_REALM',
  'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID',
] as const satisfies readonly PublicEnvKey[];

type KeycloakEnvKey = (typeof KEYCLOAK_ENV_KEYS)[number];

export function missingKeycloakEnvVars(): KeycloakEnvKey[] {
  const missing = missingPublicEnvKeys();
  return missing.filter((k): k is KeycloakEnvKey => (KEYCLOAK_ENV_KEYS as readonly string[]).includes(k));
}

export function keycloakConfig(): KeycloakConfig | null {
  const missing = missingKeycloakEnvVars();
  if (missing.length) return null;
  const env = getPublicEnv();
  return {
    baseUrl: env.keycloakUrl,
    realm: env.keycloakRealm,
    clientId: env.keycloakClientId,
  };
}

function assertConfig(): KeycloakConfig {
  const cfg = keycloakConfig();
  if (!cfg) {
    const missing = missingKeycloakEnvVars();
    const suffix = missing.length ? missing.join(', ') : KEYCLOAK_ENV_KEYS.join(', ');
    throw new Error(`Keycloak is not configured. Missing env var(s): ${suffix}.`);
  }
  return cfg;
}

export function callbackUrl(): string {
  if (typeof window === 'undefined') return '/auth/callback';
  return `${window.location.origin}/auth/callback`;
}

function randomString(bytes = 32): string {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return base64UrlEncode(data);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

async function pkceChallengeFromVerifier(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

function authBase({ baseUrl, realm }: KeycloakConfig) {
  return `${baseUrl}/realms/${encodeURIComponent(realm)}/protocol/openid-connect`;
}

export function buildKeycloakAuthorizationUrl(params: {
  cfg: KeycloakConfig;
  redirectUri: string;
  challenge: string;
  state: string;
  action?: 'login' | 'register';
  loginHint?: string;
}): string {
  const url = new URL(`${authBase(params.cfg)}/auth`);
  url.searchParams.set('client_id', params.cfg.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid profile email');
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', params.challenge);
  url.searchParams.set('state', params.state);

  if (params.loginHint) {
    url.searchParams.set('login_hint', params.loginHint);
  }

  if (params.action === 'register') {
    // Keycloak supports forcing the registration screen from the OIDC auth endpoint.
    // `screen_hint=signup` is a common OIDC hint (some IdPs use it); Keycloak may ignore it but it's harmless.
    url.searchParams.set('kc_action', 'register');
    url.searchParams.set('screen_hint', 'signup');
  }

  return url.toString();
}

export async function startKeycloakLogin(options?: { action?: 'login' | 'register'; returnTo?: string; loginHint?: string }) {
  if (typeof window === 'undefined') return;
  const cfg = assertConfig();
  const verifier = randomString(64);
  const challenge = await pkceChallengeFromVerifier(verifier);
  const state = randomString(16);

  window.sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  window.sessionStorage.setItem(OIDC_STATE_KEY, state);
  if (options?.returnTo) {
    window.sessionStorage.setItem('topcv.auth.returnTo', options.returnTo);
  } else {
    window.sessionStorage.removeItem('topcv.auth.returnTo');
  }

  window.location.href = buildKeycloakAuthorizationUrl({
    cfg,
    redirectUri: callbackUrl(),
    challenge,
    state,
    action: options?.action,
    loginHint: options?.loginHint,
  });
}

export function keycloakLogoutUrl(options?: { redirectTo?: string }): string {
  const cfg = assertConfig();
  const url = new URL(`${authBase(cfg)}/logout`);
  url.searchParams.set('post_logout_redirect_uri', options?.redirectTo ?? (typeof window !== 'undefined' ? window.location.origin : ''));
  return url.toString();
}

export async function exchangeCodeForSession(params: { code: string; state: string }) {
  const cfg = assertConfig();
  if (typeof window === 'undefined') throw new Error('exchangeCodeForSession must run in browser');

  const expectedState = window.sessionStorage.getItem(OIDC_STATE_KEY);
  if (!expectedState || expectedState !== params.state) {
    throw new Error('Invalid OIDC state');
  }
  const verifier = window.sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (!verifier) throw new Error('Missing PKCE verifier');

  const tokenUrl = `${authBase(cfg)}/token`;
  // Avoid logging secrets (code/verifier). URL alone is enough to confirm activity.
  logInfoDev('[auth] Exchanging authorization code for tokens', { tokenUrl });
  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('client_id', cfg.clientId);
  body.set('code', params.code);
  body.set('redirect_uri', callbackUrl());
  body.set('code_verifier', verifier);

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    id_token?: string;
    expires_in?: number;
  };

  const roles = extractRolesFromToken(json.id_token ?? json.access_token, cfg.clientId);
  const expiresAtEpochMs =
    typeof json.expires_in === 'number' && json.expires_in > 0 ? Date.now() + json.expires_in * 1000 : undefined;

  return {
    accessToken: json.access_token,
    idToken: json.id_token,
    expiresAtEpochMs,
    roles,
  };
}

export function getReturnToAndClear(defaultPath = '/dashboard'): string {
  if (typeof window === 'undefined') return defaultPath;
  const v = window.sessionStorage.getItem('topcv.auth.returnTo') ?? defaultPath;
  window.sessionStorage.removeItem('topcv.auth.returnTo');
  window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  window.sessionStorage.removeItem(OIDC_STATE_KEY);
  return v;
}

