import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

type ReqUser = { sub?: string; roles?: string[] } | null | undefined;

type ReqWithMeta = {
  method?: string;
  url?: string;
  headers?: Record<string, unknown>;
  user?: ReqUser;
  requestId?: string;
};

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<ReqWithMeta>();
    const res = http.getResponse<{ statusCode?: number; setHeader?: (k: string, v: string) => void }>();

    const headerRid =
      typeof req?.headers?.['x-request-id'] === 'string'
        ? req.headers['x-request-id']
        : typeof req?.headers?.['X-Request-Id'] === 'string'
          ? req.headers['X-Request-Id']
          : undefined;

    const requestId = (headerRid?.trim() || req.requestId || '').trim() || randomUUID();
    req.requestId = requestId;
    try {
      res?.setHeader?.('x-request-id', requestId);
    } catch {
      // ignore
    }

    const startedAt = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const durationMs = Date.now() - startedAt;
        const method = (req.method ?? 'UNKNOWN').toUpperCase();
        const path = req.url ?? '';
        const status = res?.statusCode ?? 0;

        const user = req.user ?? undefined;
        const userId = user && typeof user === 'object' && typeof user.sub === 'string' ? user.sub : undefined;
        const roles =
          user && typeof user === 'object' && Array.isArray(user.roles) ? user.roles.filter((r): r is string => typeof r === 'string') : undefined;

        const base = `${method} ${path} ${status} ${durationMs}ms rid=${requestId}`;
        const meta: Record<string, unknown> = { rid: requestId, method, path, status, durationMs };
        if (userId) meta.userId = userId;
        if (roles?.length) meta.roles = roles;

        // Keep logs concise; prefer meta object for searching.
        if (status >= 500) {
          this.logger.error(base, meta);
        } else if (status >= 400) {
          this.logger.warn(base, meta);
        } else {
          this.logger.log(base, meta);
        }
      }),
    );
  }
}

