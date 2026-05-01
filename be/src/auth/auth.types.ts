import type { Role } from './roles';

export type AuthUser = {
  sub: string;
  preferredUsername?: string;
  roles: Role[];
  rawRoles: string[];
};

export type OrpcContext = {
  user: AuthUser | null;
};

