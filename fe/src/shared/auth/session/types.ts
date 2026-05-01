export type AuthSession = {
  accessToken: string;
  idToken?: string;
  expiresAtEpochMs?: number;
  roles: string[];
};

