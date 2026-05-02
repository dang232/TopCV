export const TOPCV_REALM_ROLES = ['admin', 'staff'] as const;

/** Keycloak realm role names used by this app (lowercase). */
export type TopcvRealmRole = (typeof TOPCV_REALM_ROLES)[number];

/** Default role for self-service registration (avoid magic index on `TOPCV_REALM_ROLES`). */
export const DEFAULT_SELF_REGISTER_ROLE = 'staff' satisfies TopcvRealmRole;

