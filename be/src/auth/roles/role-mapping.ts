import { Role } from './roles';

export function mapToDomainRoles(rawRoles: string[]): Role[] {
  const upper = new Set(rawRoles.map((r) => r.toUpperCase()));
  const out: Role[] = [];
  if (upper.has('ADMIN')) out.push(Role.ADMIN);
  if (upper.has('STAFF')) out.push(Role.STAFF);
  return out;
}
