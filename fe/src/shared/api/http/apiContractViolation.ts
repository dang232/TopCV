import type { z } from 'zod';

export class ApiContractViolationError extends Error {
  readonly route: string;

  readonly issues: z.ZodError['issues'];

  constructor(init: { route: string; issues: z.ZodError['issues']; message?: string }) {
    super(init.message ?? `API response for "${init.route}" did not match the shared schema`);
    this.name = 'ApiContractViolationError';
    this.route = init.route;
    this.issues = init.issues;
  }
}
