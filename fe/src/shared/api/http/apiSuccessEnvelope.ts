/** Keys allowed on Nest `ApiResponseInterceptor` success bodies (`/api/v1`). */
export const API_V1_ENVELOPE_KEYS = new Set(['status', 'message', 'data']);

/**
 * Whether `body` matches `{ status?, message?, data: object }` with no other own keys
 * and `data` a non-array object (the payload).
 */
export function isApiV1SuccessEnvelope(body: unknown): body is { data: object } & Record<string, unknown> {
  if (body === null || body === undefined) return false;
  if (typeof body !== 'object' || Array.isArray(body)) return false;
  const o = body as Record<string, unknown>;
  const keys = Object.keys(o);
  const data = o.data;
  return (
    keys.length > 0 &&
    keys.every((k) => API_V1_ENVELOPE_KEYS.has(k)) &&
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data)
  );
}

/**
 * Unwraps `{ status, message?, data }` API v1 success bodies to the inner `data` payload.
 * Plain objects that are not envelopes (e.g. domain models with their own `data` plus other fields) are returned unchanged.
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
