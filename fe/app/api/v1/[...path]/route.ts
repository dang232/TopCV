import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function getApiTarget(): string {
  // Server-side only env var (NOT exposed to client). Defaults to local Nest port.
  return (process.env.API_PROXY_TARGET ?? 'http://localhost:3000').replace(/\/$/, '');
}

function buildTargetUrl(req: NextRequest): string {
  const target = getApiTarget();
  const path = req.nextUrl.pathname.replace(/^\/api\/v1/, '');
  const search = req.nextUrl.search;
  return `${target}/api/v1${path}${search}`;
}

function buildForwardHeaders(req: NextRequest): Headers {
  const headers = new Headers(req.headers);

  // Let the destination compute these.
  headers.delete('host');
  headers.delete('content-length');

  // Preserve Authorization explicitly (some proxy layers can be opinionated).
  const auth = req.headers.get('authorization');
  if (auth) headers.set('authorization', auth);

  return headers;
}

async function proxy(req: NextRequest): Promise<Response> {
  const url = buildTargetUrl(req);
  const method = req.method.toUpperCase();
  const headers = buildForwardHeaders(req);

  const init: RequestInit = {
    method,
    headers,
    redirect: 'manual',
    cache: 'no-store',
  };

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  const res = await fetch(url, init);

  // Stream body through; keep status + headers.
  return new NextResponse(res.body, {
    status: res.status,
    headers: res.headers,
  });
}

export async function GET(req: NextRequest) {
  return proxy(req);
}
export async function POST(req: NextRequest) {
  return proxy(req);
}
export async function PUT(req: NextRequest) {
  return proxy(req);
}
export async function PATCH(req: NextRequest) {
  return proxy(req);
}
export async function DELETE(req: NextRequest) {
  return proxy(req);
}
export async function OPTIONS(req: NextRequest) {
  return proxy(req);
}

