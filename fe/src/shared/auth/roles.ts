export type AppRole = 'ADMIN' | 'STAFF';

export function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

export function normalizeRoles(roles: string[] | null | undefined): string[] {
  if (!roles) return [];
  return roles
    .filter((r): r is string => typeof r === 'string')
    .map(normalizeRole)
    .filter(Boolean);
}

export function hasRole(roles: string[] | null | undefined, role: AppRole): boolean {
  const normalized = normalizeRole(role);
  return normalizeRoles(roles).includes(normalized);
}

