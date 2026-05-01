export function isProd(): boolean {
  return (process.env.NODE_ENV ?? '').toLowerCase() === 'production';
}

function normalizeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return { message: String(err) };
}

/**
 * Dev-only detailed error logging.
 *
 * In production this is a no-op (to avoid leaking stack traces / sensitive meta into logs).
 */
export function logErrorDev(message: string, meta?: Record<string, unknown>, err?: unknown): void {
  if (isProd()) return;

  const payload: Record<string, unknown> = { ...(meta ?? {}) };
  if (err !== undefined) payload.error = normalizeError(err);

  console.error(message, payload);
}

