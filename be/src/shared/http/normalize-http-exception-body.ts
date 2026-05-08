import { makeRestError } from './rest-error';

type NestStyleError = {
  statusCode?: unknown;
  message?: unknown;
  error?: unknown;
};

function stringFromMessageField(message: unknown): string | undefined {
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) {
    const parts = message.filter((x): x is string => typeof x === 'string' && Boolean(x.trim()));
    return parts.length ? parts.join('; ') : undefined;
  }
  return undefined;
}

/**
 * Maps Nest `HttpException` response payloads to JSON bodies the FE parsers understand,
 * without changing shapes that are already intentional (`restHttpException`, forms REST).
 */
export function normalizeHttpExceptionBody(status: number, raw: string | object): object {
  if (typeof raw === 'string') {
    return makeRestError(`HTTP_${status}`, raw);
  }

  const o = raw as Record<string, unknown>;

  // `restHttpException` / `makeRestError` → `{ error: { code, message, details? } }`
  if (o.error && typeof o.error === 'object' && !Array.isArray(o.error)) {
    const inner = o.error as Record<string, unknown>;
    if (typeof inner.code === 'string' && Boolean(inner.code.trim()) && typeof inner.message === 'string') {
      return o;
    }
  }

  // Forms REST (`rethrowFormsRest`): `{ code, message, data? }` at top level — preserve for clients/tests.
  if (typeof o.code === 'string' && Boolean(o.code.trim())) {
    const msg = stringFromMessageField(o.message);
    if (msg !== undefined) {
      return {
        code: o.code,
        message: msg,
        ...(o.data !== undefined ? { data: o.data } : {}),
      };
    }
  }

  // Nest default: `{ statusCode, message, error }`
  const nest = o as NestStyleError;
  if (typeof nest.statusCode === 'number' && nest.message !== undefined) {
    const msg = stringFromMessageField(nest.message) ?? 'Request failed';
    const errLabel = typeof nest.error === 'string' && nest.error.trim() ? nest.error : 'HTTP_EXCEPTION';
    const code = errLabel.replace(/\s+/g, '_').toUpperCase();
    const details =
      Array.isArray(nest.message) && nest.message.length
        ? { fields: nest.message.filter((x): x is string => typeof x === 'string') }
        : undefined;
    return makeRestError(code, msg, details);
  }

  return makeRestError('HTTP_ERROR', 'Request failed');
}
