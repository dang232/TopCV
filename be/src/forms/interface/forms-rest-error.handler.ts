import { HttpException, type Logger } from '@nestjs/common';

import { mapFormsFailureToOrpc, mapUnhandledFormsProcedureFailure } from './forms-orpc-error.mapper';

/** Maps domain / validation failures to JSON HTTP errors (same semantics as oRPC). */
export function rethrowFormsRest(error: unknown, procedure: string, logger: Pick<Logger, 'error'>): never {
  const mapped = mapFormsFailureToOrpc(error);
  if (mapped) {
    throw new HttpException(
      {
        code: String(mapped.code),
        message: mapped.message,
        data: 'data' in mapped ? (mapped as { data?: unknown }).data : undefined,
      },
      mapped.status,
    );
  }

  const fallback = mapUnhandledFormsProcedureFailure(procedure, error, logger);
  throw new HttpException(
    { code: String(fallback.code), message: fallback.message },
    fallback.status,
  );
}
