import { HttpException } from '@nestjs/common';

import { isProd } from '../logging/logger';

export type RestErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

function toDevErrorObject(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const e = err as Error & { cause?: unknown };
    return {
      name: e.name,
      message: e.message,
      stack: e.stack,
      ...(e.cause !== undefined ? { cause: toDevErrorObject(e.cause) } : {}),
    };
  }
  return { message: String(err) };
}

/**
 * Attaches safe-ish diagnostic details in non-production only.
 *
 * Callers can pass this as `details`; `makeRestError` will drop it in prod.
 */
export function devErrorDetails(err: unknown): Record<string, unknown> | undefined {
  if (isProd()) return undefined;
  return toDevErrorObject(err);
}

export function makeRestError(code: string, message: string, details?: unknown): RestErrorBody {
  if (details === undefined || isProd()) {
    return { error: { code, message } };
  }
  if (typeof details === 'string') {
    return { error: { code, message, details: { message: details } } };
  }
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    return { error: { code, message, details: details as Record<string, unknown> } };
  }
  return { error: { code, message, details: { value: details } } };
}

export function restHttpException(status: number, code: string, message: string, details?: unknown): HttpException {
  return new HttpException(makeRestError(code, message, details), status);
}

