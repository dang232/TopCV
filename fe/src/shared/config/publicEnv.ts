import { PUBLIC_ENV_KEYS, type PublicEnv, type PublicEnvKey } from './publicEnv.spec';

function readNonEmptyValue(v: string | undefined): string | null {
  const trimmed = (v ?? '').trim();
  return trimmed.length ? trimmed : null;
}

export function missingPublicEnvKeys(): PublicEnvKey[] {
  // IMPORTANT: This module is used from Client Components.
  // Next.js only inlines `process.env.NEXT_PUBLIC_*` when accessed as a literal,
  // so we must not use `process.env[key]` dynamic indexing here.
  const apiBaseUrl = readNonEmptyValue(process.env.NEXT_PUBLIC_API_BASE_URL);
  const keycloakUrl = readNonEmptyValue(process.env.NEXT_PUBLIC_KEYCLOAK_URL);
  const keycloakRealm = readNonEmptyValue(process.env.NEXT_PUBLIC_KEYCLOAK_REALM);
  const keycloakClientId = readNonEmptyValue(process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID);

  const missing: PublicEnvKey[] = [];
  if (!apiBaseUrl) missing.push('NEXT_PUBLIC_API_BASE_URL');
  if (!keycloakUrl) missing.push('NEXT_PUBLIC_KEYCLOAK_URL');
  if (!keycloakRealm) missing.push('NEXT_PUBLIC_KEYCLOAK_REALM');
  if (!keycloakClientId) missing.push('NEXT_PUBLIC_KEYCLOAK_CLIENT_ID');
  return missing;
}

export function getPublicEnv(): PublicEnv {
  const missing = missingPublicEnvKeys();

  // `NEXT_PUBLIC_API_BASE_URL` has a safe local default (keeps DX + tests stable),
  // and other auth-related variables may be configured per environment.
  // Missing values are handled by callers (e.g. disabling auth controls + showing a warning).
  const missingIgnoringOptional = missing.filter((k) => k !== 'NEXT_PUBLIC_API_BASE_URL');

  const apiBaseUrl = (
    readNonEmptyValue(process.env.NEXT_PUBLIC_API_BASE_URL) ??
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  ).replace(/\/$/, '');
  const keycloakUrl = (readNonEmptyValue(process.env.NEXT_PUBLIC_KEYCLOAK_URL) ?? '').replace(/\/$/, '');
  const keycloakRealm = readNonEmptyValue(process.env.NEXT_PUBLIC_KEYCLOAK_REALM) ?? '';
  const keycloakClientId = readNonEmptyValue(process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID) ?? '';

  // Keep this function side-effect free; callers can inspect `missingPublicEnvKeys()`.
  void missingIgnoringOptional;

  return {
    apiBaseUrl,
    keycloakUrl,
    keycloakRealm,
    keycloakClientId,
  };
}

export { PUBLIC_ENV_KEYS };
export type { PublicEnv, PublicEnvKey };

