import { SetMetadata } from '@nestjs/common';

import type { Role } from './roles';

export const ROLES_KEY = 'roles' as const;

/** Declares roles allowed for the route (user must have at least one). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
