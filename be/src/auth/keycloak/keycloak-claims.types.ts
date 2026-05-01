export type KeycloakAccess = {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
  preferred_username?: string;
};
