export function isProd(): boolean {
  // Next.js inlines `process.env.NODE_ENV`; keep this simple for bundlers.
  return (process.env.NODE_ENV ?? '').toLowerCase() === 'production';
}

function normalizeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const anyErr = err as Error & { status?: unknown; body?: unknown; cause?: unknown };
    const base: Record<string, unknown> = { name: err.name, message: err.message, stack: err.stack };

    // Helpful for API failures (e.g. ApiHttpError) without importing app code here.
    if (typeof anyErr.status === 'number') base.status = anyErr.status;
    if (anyErr.body !== undefined) {
      base.body = anyErr.body;
      if (anyErr.body && typeof anyErr.body === 'object' && 'error' in (anyErr.body as Record<string, unknown>)) {
        base.bodyError = (anyErr.body as { error?: unknown }).error;
      }
    }
    if (anyErr.cause !== undefined) base.cause = normalizeError(anyErr.cause);

    return base;
  }
  return { message: String(err) };
}

/**
 * Dev-only detailed error logging.
 *
 * Safe for SSR: will only run when invoked; uses console only in dev.
 */
export function logErrorDev(message: string, meta?: Record<string, unknown>, err?: unknown): void {
  if (isProd()) return;
  const payload: Record<string, unknown> = { ...(meta ?? {}) };
  if (err !== undefined) payload.error = normalizeError(err);

  console.error(message, payload);
}

/** Dev-only info logging (kept separate to avoid `console.*` spread). */
export function logInfoDev(message: string, meta?: Record<string, unknown>): void {
  if (isProd()) return;
  console.info(message, meta ?? {});
}

