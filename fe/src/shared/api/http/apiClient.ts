import { API_V1 } from './constants';
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

function defaultApiOrigin(): string {
  return getPublicEnv().apiBaseUrl.replace(/\/$/, '');
}

type RestErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

function getServerErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const maybe = body as RestErrorResponse;
  const msg = maybe.error?.message;
  return typeof msg === 'string' && msg.trim() ? msg : undefined;
}

export function createApiClient(options: CreateApiClientOptions = {}) {
  const fetchFn = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const origin = (options.apiOrigin ?? defaultApiOrigin()).replace(/\/$/, '');

  async function apiFetch(path: string, init: RequestInit & { json?: unknown } = {}): Promise<Response> {
    const rel = path.startsWith('/') ? path : `/${path}`;
    const url = `${origin}${API_V1}${rel}`;
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    const token = await options.getAccessToken?.();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (init.json !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    return fetchFn(url, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    });
  }

  async function apiFetchJson<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
    const res = await apiFetch(path, init);
    if (!res.ok) {
      let body: unknown;
      const text = await res.text();
      try {
        body = text ? JSON.parse(text) : undefined;
      } catch {
        body = text;
      }
      throw new ApiHttpError(res.status, body, getServerErrorMessage(body));
    }
    if (res.status === 204) {
      return undefined as T;
    }
    return res.json() as Promise<T>;
  }

  return { apiFetch, apiFetchJson, origin };
}

const defaultClient = createApiClient({
  getAccessToken: () => getAccessTokenFromStorage(),
});

export const apiFetch = defaultClient.apiFetch.bind(defaultClient);
export const apiFetchJson = defaultClient.apiFetchJson.bind(defaultClient);
