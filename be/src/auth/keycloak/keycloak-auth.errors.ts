export class MisconfigError extends Error {
  readonly code = 'MISCONFIG' as const;
  constructor(message: string) {
    super(message);
    this.name = 'MisconfigError';
  }
}

export class KeycloakUnreachableError extends Error {
  readonly code = 'KEYCLOAK_UNREACHABLE' as const;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'KeycloakUnreachableError';
    (this as unknown as { cause?: unknown }).cause = options?.cause;
  }
}

export class KeycloakConflictError extends Error {
  readonly code = 'KEYCLOAK_CONFLICT' as const;
  readonly details?: unknown;
  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'KeycloakConflictError';
    this.details = details;
  }
}

export class InvalidRoleError extends Error {
  readonly code = 'INVALID_ROLE' as const;
  readonly role: string;
  constructor(role: string) {
    super(`Invalid role: ${role}`);
    this.name = 'InvalidRoleError';
    this.role = role;
  }
}

export class KeycloakBadResponseError extends Error {
  readonly code = 'KEYCLOAK_BAD_RESPONSE' as const;
  readonly status: number;
  readonly body?: string;

  constructor(message: string, input: { status: number; body?: string }) {
    super(message);
    this.name = 'KeycloakBadResponseError';
    this.status = input.status;
    this.body = input.body;
  }
}

export class KeycloakForbiddenError extends Error {
  readonly code = 'KEYCLOAK_FORBIDDEN' as const;
  readonly status = 403 as const;
  readonly step: string;
  readonly body?: string;

  constructor(message: string, input: { step: string; body?: string }) {
    super(message);
    this.name = 'KeycloakForbiddenError';
    this.step = input.step;
    this.body = input.body;
  }
}

export class KeycloakAccountNotReadyError extends Error {
  readonly code = 'ACCOUNT_NOT_READY' as const;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'KeycloakAccountNotReadyError';
    this.details = details;
  }
}

