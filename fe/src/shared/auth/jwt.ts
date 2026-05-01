function base64UrlToBase64(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return padded;
}

export function parseJwt<T = unknown>(token: string): T | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const json = atob(base64UrlToBase64(parts[1]));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function extractRolesFromToken(token: string, clientId?: string): string[] {
  const payload = parseJwt<unknown>(token);
  if (!payload) return [];
  if (typeof payload !== 'object' || payload === null) return [];
  const obj = payload as Record<string, unknown>;

  const roles = new Set<string>();
  const realmAccess = obj['realm_access'];
  const realmRoles: unknown =
    typeof realmAccess === 'object' && realmAccess !== null ? (realmAccess as Record<string, unknown>)['roles'] : undefined;
  if (Array.isArray(realmRoles)) {
    for (const r of realmRoles) if (typeof r === 'string') roles.add(r);
  }

  const resourceAccess = obj['resource_access'];
  const resourceRoles: unknown =
    clientId && typeof resourceAccess === 'object' && resourceAccess !== null
      ? ((resourceAccess as Record<string, unknown>)[clientId] as Record<string, unknown> | undefined)?.['roles']
      : undefined;
  if (Array.isArray(resourceRoles)) {
    for (const r of resourceRoles) if (typeof r === 'string') roles.add(r);
  }

  return [...roles];
}

