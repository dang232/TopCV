import { API_V1 } from './constants';
import { buildUserFacingHttpErrorMessage, extractRestErrorFromBody } from './restApiError';
import { clearSessionOnUnauthorizedApiResponse, shouldAttachBearerForApiRequest } from './unauthorizedSession';
import { ensureSessionAccessTokenFresh, refreshAccessTokenSingleFlight, shouldAttempt401Refresh } from '@/src/shared/auth/sessionRefresh';
import { getAccessTokenFromStorage } from '@/src/shared/auth';
import { getPublicEnv } from '@/src/shared/config/publicEnv';

export class ApiHttpError extends Error {
  readonly status: number;

  readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = 'ApiHttpError';
    this.status = status;
    this.body = body;
  }
}

export type CreateApiClientOptions = {
  fetchImpl?: typeof fetch;
  getAccessToken?: () => string | null | Promise<string | null>;
  /** API origin without trailing slash (defaults to `NEXT_PUBLIC_API_BASE_URL` or localhost). */
  apiOrigin?: string;
};

type ApiLogEntry = {
  ts: number;
  method: string;
  url: string;
  status?: number;
  ok?: boolean;
  durationMs: number;
  errorCause?: string;
  hasAuthHeader: boolean;
};

function defaultApiOrigin(): string {
  return getPublicEnv().apiBaseUrl.replace(/\/$/, '');
}

function getServerErrorMessage(body: unknown): string | undefined {
  return extractRestErrorFromBody(body).message;
}

export function createApiClient(options: CreateApiClientOptions = {}) {
  const fetchFn = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const origin = (options.apiOrigin ?? defaultApiOrigin()).replace(/\/$/, '');

  const isDev = (process.env.NODE_ENV ?? '').toLowerCase() !== 'production';
  const maxLogEntries = 200;

  function nowMs(): number {
    // `performance.now()` gives better resolution; fall back for older runtimes.
    return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
  }

  function pushApiLog(entry: ApiLogEntry): void {
    if (!isDev) return;
    try {
      const g = globalThis as unknown as { __apiLog?: ApiLogEntry[] };
      const buf = (g.__apiLog ??= []);
      buf.push(entry);
      if (buf.length > maxLogEntries) {
        buf.splice(0, buf.length - maxLogEntries);
      }

      // Mirror to window for easy debugging from the browser console/pages.
      if (typeof window !== 'undefined') {
        (window as unknown as { __apiLog?: ApiLogEntry[] }).__apiLog = buf;
      }
    } catch {
      // Never let debugging utilities break real API calls.
    }
  }

  function logApiDev(entry: ApiLogEntry): void {
    if (!isDev) return;
    const { method, url, status, durationMs, errorCause, hasAuthHeader } = entry;
    // Avoid dumping headers/body; redact auth completely.
    const base = `[api] ${method} ${url} ${status ?? 'ERR'} ${Math.round(durationMs)}ms`;
    const meta: Record<string, unknown> = { status, durationMs: Math.round(durationMs), hasAuthHeader };
    if (errorCause) meta.errorCause = errorCause;
    (status && status >= 400 ? console.warn : console.debug)(base, meta);
  }

  async function buildAuthorizedHeaders(rel: string, init: RequestInit & { json?: unknown }): Promise<Headers> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    const token = shouldAttachBearerForApiRequest(rel, init) ? await options.getAccessToken?.() : null;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (init.json !== undefined) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  }

  async function apiFetchRaw(path: string, init: RequestInit & { json?: unknown } = {}, is401Retry = false): Promise<Response> {
    const rel = path.startsWith('/') ? path : `/${path}`;
    const url = `${origin}${API_V1}${rel}`;
    const headers = await buildAuthorizedHeaders(rel, init);

    let res = await fetchFn(url, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    });

    if (res.status === 401 && !is401Retry && shouldAttempt401Refresh(rel)) {
      const refreshed = await refreshAccessTokenSingleFlight();
      if (refreshed) {
        const headers2 = await buildAuthorizedHeaders(rel, init);
        res = await fetchFn(url, {
          ...init,
          headers: headers2,
          body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
        });
      }
    }

    return res;
  }

  async function apiFetch(path: string, init: RequestInit & { json?: unknown } = {}): Promise<Response> {
    const rel = path.startsWith('/') ? path : `/${path}`;
    const url = `${origin}${API_V1}${rel}`;
    const method = (init.method ?? 'GET').toUpperCase();
    const start = nowMs();

    const hasAuthHeader = (() => {
      const h = new Headers(init.headers);
      return h.has('Authorization') || h.has('authorization');
    })();

    try {
      const res = await apiFetchRaw(path, init);
      const durationMs = nowMs() - start;
      const entry: ApiLogEntry = {
        ts: Date.now(),
        method,
        url,
        status: res.status,
        ok: res.ok,
        durationMs,
        hasAuthHeader,
      };
      pushApiLog(entry);
      logApiDev(entry);
      if (res.status === 401) {
        clearSessionOnUnauthorizedApiResponse(rel);
      }
      return res;
    } catch (err) {
      const durationMs = nowMs() - start;
      const entry: ApiLogEntry = {
        ts: Date.now(),
        method,
        url,
        durationMs,
        hasAuthHeader,
        errorCause: err instanceof Error ? err.message : String(err),
      };
      pushApiLog(entry);
      logApiDev(entry);
      throw err;
    }
  }

  async function apiFetchJson<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
    const rel = path.startsWith('/') ? path : `/${path}`;
    const url = `${origin}${API_V1}${rel}`;
    const method = (init.method ?? 'GET').toUpperCase();
    const start = nowMs();
    const hasAuthHeader = (() => {
      const h = new Headers(init.headers);
      return h.has('Authorization') || h.has('authorization');
    })();

    const res = await apiFetchRaw(path, init);
    if (!res.ok) {
      if (res.status === 401) {
        clearSessionOnUnauthorizedApiResponse(rel);
      }
      let body: unknown;
      const text = await res.text();
      try {
        body = text ? JSON.parse(text) : undefined;
      } catch {
        body = text;
      }
      const durationMs = nowMs() - start;
      const entry: ApiLogEntry = {
        ts: Date.now(),
        method,
        url,
        status: res.status,
        ok: res.ok,
        durationMs,
        hasAuthHeader,
        errorCause: getServerErrorMessage(body) ?? (typeof body === 'string' ? body : undefined),
      };
      pushApiLog(entry);
      logApiDev(entry);
      throw new ApiHttpError(
        res.status,
        body,
        buildUserFacingHttpErrorMessage(res.status, body, getServerErrorMessage(body)),
      );
    }
    if (res.status === 204) {
      const durationMs = nowMs() - start;
      const entry: ApiLogEntry = {
        ts: Date.now(),
        method,
        url,
        status: res.status,
        ok: true,
        durationMs,
        hasAuthHeader,
      };
      pushApiLog(entry);
      logApiDev(entry);
      return undefined as T;
    }
    const json = (await res.json()) as T;
    const durationMs = nowMs() - start;
    const entry: ApiLogEntry = {
      ts: Date.now(),
      method,
      url,
      status: res.status,
      ok: true,
      durationMs,
      hasAuthHeader,
    };
    pushApiLog(entry);
    logApiDev(entry);
    return json;
  }

  return { apiFetch, apiFetchJson, origin };
}

const defaultClient = createApiClient({
  getAccessToken: async () => {
    await ensureSessionAccessTokenFresh();
    return getAccessTokenFromStorage();
  },
});

export const apiFetch = defaultClient.apiFetch.bind(defaultClient);
export const apiFetchJson = defaultClient.apiFetchJson.bind(defaultClient);
