/** Keys allowed on Nest `ApiResponseInterceptor` success bodies (`/api/v1`). */
export const API_V1_ENVELOPE_KEYS = new Set(['status', 'message', 'data']);

/**
 * Whether `body` matches `{ status: 'success', message?, data }` with no other own keys.
 */
export function isApiV1SuccessEnvelope(body: unknown): body is { status: 'success'; data: unknown; message?: unknown } {
  if (body === null || body === undefined) return false;
  if (typeof body !== 'object' || Array.isArray(body)) return false;
  const o = body as Record<string, unknown>;
  const keys = Object.keys(o);
  return keys.every((k) => API_V1_ENVELOPE_KEYS.has(k)) && o.status === 'success' && 'data' in o;
}

/**
 * Unwraps `{ status: 'success', message?, data }` API v1 success bodies to the inner `data` payload.
 * Plain objects that are not exact success envelopes (e.g. domain models with their own `data`) are returned unchanged.
 */
export function unwrapApiV1SuccessJson<T>(body: unknown): T {
  if (body === null || body === undefined) return body as T;
  if (Array.isArray(body)) return body as T;
  if (typeof body !== 'object') return body as T;
  if (isApiV1SuccessEnvelope(body)) {
    return (body as { data: T }).data;
  }
  return body as T;
}
