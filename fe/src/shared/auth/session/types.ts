/**
 * SPA session (sessionStorage). Access + refresh tokens are readable to JS (XSS risk); tab-scoped
 * persistence and short access TTL limit exposure. No BFF — refresh uses `POST /auth/refresh` with single-flight dedupe.
 */
export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAtEpochMs?: number;
  roles: string[];
};

