/**
 * Cross-cutting oRPC codes shared by multiple bounded contexts (UI hints, logging).
 * Not domain vocabulary — keep domain-specific codes next to their transport contract.
 */
export const OrpcCommonErrorCode = {
  InternalServerError: 'INTERNAL_SERVER_ERROR',
} as const;

export type OrpcCommonErrorCode = (typeof OrpcCommonErrorCode)[keyof typeof OrpcCommonErrorCode];
