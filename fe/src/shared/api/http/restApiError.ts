/**
 * Parses Nest `restHttpException` / `{ error: { code, message } }` bodies and
 * builds concise, non-secret-leaking copy for UI and thrown errors.
 */

type RestErrorShape = {
  error?: {
    code?: unknown;
    message?: unknown;
  };
  code?: unknown;
  message?: unknown;
  statusCode?: unknown;
};

const MAX_SERVER_MESSAGE_LEN = 280;

function stringMessageFromUnknown(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v;
  if (Array.isArray(v)) {
    const first = v.find((x) => typeof x === 'string' && (x as string).trim());
    return typeof first === 'string' ? first : undefined;
  }
  return undefined;
}

function isUnsafeServerMessageText(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (t.length > MAX_SERVER_MESSAGE_LEN) return true;
  const lower = t.slice(0, 64).toLowerCase();
  if (lower.includes('<!doctype') || lower.includes('<html')) return true;
  return false;
}

export function extractRestErrorFromBody(body: unknown): { code?: string; message?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  const o = body as RestErrorShape;

  const nested = o.error;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const code = typeof nested.code === 'string' && nested.code.trim() ? nested.code : undefined;
    const message = stringMessageFromUnknown(nested.message);
    if (code || message) return { code, message };
  }

  const flatCode = typeof o.code === 'string' && o.code.trim() ? o.code : undefined;
  const flatMessage = stringMessageFromUnknown(o.message);
  if (flatCode || flatMessage) return { code: flatCode, message: flatMessage };

  return {};
}

function statusFallbackMessage(status: number): string {
  switch (status) {
    case 400:
      return 'The request could not be processed. Check your input and try again.';
    case 401:
      return 'You need to sign in again to continue.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'That resource was not found.';
    case 409:
      return 'This action conflicts with the current state. Try refreshing the page.';
    case 413:
      return 'The request payload is too large.';
    case 422:
      return 'The server could not validate your request.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 502:
      return 'The authentication service is temporarily unavailable. Please try again shortly.';
    case 503:
      return 'The service is temporarily unavailable. Please try again shortly.';
    case 504:
      return 'The request timed out. Please try again.';
    default:
      if (status >= 500) return 'Something went wrong on the server. Please try again later.';
      if (status >= 400) return `The request could not be completed (${status}).`;
      return 'The request could not be completed.';
  }
}

/** Prefer server `error.message` when it looks safe; otherwise status-based copy. Optionally enrich with known `error.code` labels. */
export function buildUserFacingHttpErrorMessage(status: number, body: unknown, serverMessage?: string): string {
  const fromBody = extractRestErrorFromBody(body).message;
  const candidate = (serverMessage ?? fromBody)?.trim();
  if (candidate && !isUnsafeServerMessageText(candidate)) {
    return candidate;
  }

  return statusFallbackMessage(status);
}

function isApiHttpErrorLike(err: unknown): err is { status: number; body: unknown; message?: string } {
  return (
    err instanceof Error &&
    err.name === 'ApiHttpError' &&
    typeof (err as { status?: unknown }).status === 'number'
  );
}

/**
 * Single entry point for turning API/network failures into safe UI copy.
 * Prefer this over re-parsing bodies in views.
 */
export function toUserFacingMessage(err: unknown): string {
  if (isApiHttpErrorLike(err)) {
    return buildUserFacingHttpErrorMessage(err.status, err.body, err.message);
  }
  if (err instanceof TypeError && /fetch|network/i.test(String(err.message))) {
    return 'Unable to reach the server. Check your connection and that the API is running.';
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  if (typeof err === 'string' && err.trim()) {
    return err;
  }
  return 'Something went wrong. Please try again.';
}
