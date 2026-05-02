import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

import { HTTP_API_V1_ROOT_PATH } from '../../http/api-path.constants';

const API_V1_PREFIX = `/${HTTP_API_V1_ROOT_PATH}`;

function requestPathname(req: { path?: string; url?: string }): string {
  const p = typeof req.path === 'string' && req.path ? req.path : undefined;
  if (p) return p;
  const u = typeof req.url === 'string' ? req.url : '';
  return u.split('?')[0] ?? '';
}

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{ path?: string; url?: string }>();
    const pathname = requestPathname(req);
    const isApiV1 =
      pathname === API_V1_PREFIX || pathname.startsWith(`${API_V1_PREFIX}/`);

    if (!isApiV1) {
      return next.handle();
    }

    const source = next.handle();
    return new Observable((subscriber) => {
      const sub = source.subscribe({
        next: (data) => {
          subscriber.next({ status: 'success', data });
        },
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
      return () => sub.unsubscribe();
    });
  }
}
