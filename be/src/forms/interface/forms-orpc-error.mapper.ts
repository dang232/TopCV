import type { Logger } from '@nestjs/common';
import { ORPCError } from '@orpc/server';
import { FormsOrpcErrorCode } from '@topcv/shared/forms';
import { OrpcCommonErrorCode } from '@topcv/shared';
import { ZodError } from 'zod';

import { FormNotFound } from '../domain/errors/form-not-found';

/** Known domain/application failures → wire-safe oRPC errors (interface / adapter concern). */
export function mapFormsFailureToOrpc(error: unknown): ORPCError<string, unknown> | undefined {
  if (error instanceof ORPCError) {
    return error;
  }

  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? 'Validation failed';

    return new ORPCError('UNPROCESSABLE_CONTENT', {
      status: 422,
      message,
      defined: true,
      cause: error,
    });
  }

  if (error instanceof FormNotFound) {
    return new ORPCError(FormsOrpcErrorCode.FormNotFound, {
      status: 404,
      message: error.message,
      defined: true,
      data: { resource: 'form' as const, id: error.formId },
    });
  }

  return undefined;
}

export function mapUnhandledFormsProcedureFailure(
  procedure: string,
  error: unknown,
  logger: Pick<Logger, 'error'>,
): ORPCError<string, unknown> {
  const detail = error instanceof Error ? error.message : String(error);
  logger.error(`${procedure}: ${detail}`, error instanceof Error ? error.stack : undefined);

  const expose = process.env.NODE_ENV !== 'production';

  return new ORPCError(OrpcCommonErrorCode.InternalServerError, {
    status: 500,
    message: expose ? detail : 'Internal server error',
    defined: expose,
    cause: error instanceof Error ? error : undefined,
  });
}
