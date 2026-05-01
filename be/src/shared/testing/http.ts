export type TestResponseInit = {
  status?: number;
  headers?: Record<string, string>;
};

export function jsonResponse(body: unknown, init?: TestResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
}

export function textResponse(body: string, init?: TestResponseInit) {
  return new Response(body, {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'text/plain', ...(init?.headers ?? {}) },
  });
}

