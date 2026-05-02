/**
 * SPA session (localStorage). Access + refresh tokens are readable to JS (XSS risk); short access TTL
 * limits exposure. No BFF — refresh uses `POST /auth/refresh` with single-flight dedupe in `sessionRefresh`.
 */
export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAtEpochMs?: number;
  roles: string[];
};

