/**
 * Canonical JSON success envelope for `/api/v1/**` REST handlers.
 * Controllers keep returning plain DTOs; `ApiResponseInterceptor` wraps them.
 */

export type ApiSuccessBody<T = unknown> = {
  status: 'success';
  data: T;
  message?: string;
};

export function wrapApiSuccess<T>(data: T, message?: string): ApiSuccessBody<T> {
  const body = { status: 'success', data: data ?? null } as ApiSuccessBody<T>;
  return message === undefined ? body : { ...body, message };
}

/** True when the value is already an explicit API success envelope (avoid double-wrap). */
export function isApiSuccessEnvelope(value: unknown): value is ApiSuccessBody<unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  return o.status === 'success' && 'data' in o;
}
