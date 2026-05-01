export const TOPCV_REALM_ROLES = ['admin', 'staff'] as const;

/** Keycloak realm role names used by this app (lowercase). */
export type TopcvRealmRole = (typeof TOPCV_REALM_ROLES)[number];

