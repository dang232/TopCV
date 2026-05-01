import type { Request } from 'express';

import type { AuthUser } from './auth.types';

export type RequestWithAuthUser = Request & {
  user?: AuthUser | null;
};
