import { HTTP_API_V1_ROOT_PATH } from '../../http/api-path.constants';

export function requestPathname(req: { originalUrl?: string; url?: string }): string {
  const raw = (req.originalUrl ?? req.url ?? '').split('?')[0] ?? '';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export function isApiV1HttpPath(pathname: string): boolean {
  const prefix = `/${HTTP_API_V1_ROOT_PATH}`;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
