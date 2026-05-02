import type { Request } from 'express';

import type { AuthUser } from './auth.types';

export type RequestWithAuthUser = Request & {
  user?: AuthUser | null;
  authInfo?: {
    outcome:
      | 'missing_authorization'
      | 'invalid_authorization_scheme'
      | 'missing_bearer_token'
      | 'missing_issuer'
      | 'jwks_fetch_failed'
      | 'jwt_invalid'
      | 'jwt_verify_failed'
      | 'ok';
    errorName?: string;
  };
  requestId?: string;
};

/** Shared metadata for auth guard warning logs (Express request id + path + JWT outcome). */
export function resolveRequestLogMeta(req: RequestWithAuthUser): {
  rid: string | undefined;
  path: string;
  outcome: string;
  errorName?: string;
} {
  const rid = req.requestId ?? req.get?.('x-request-id') ?? undefined;
  return {
    rid,
    path: typeof req.url === 'string' ? req.url : '',
    outcome: req.authInfo?.outcome ?? 'unknown',
    errorName: req.authInfo?.errorName,
  };
}
