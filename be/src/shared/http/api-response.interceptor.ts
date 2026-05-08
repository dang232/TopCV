import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

import { isApiSuccessEnvelope, wrapApiSuccess } from './api-success';
import { isApiV1HttpPath, requestPathname } from './api-v1-http-path';

function shouldSkipWrapping(data: unknown): boolean {
  return data instanceof Uint8Array || typeof (data as { pipe?: unknown }).pipe === 'function' || isApiSuccessEnvelope(data);
}

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<{ originalUrl?: string; url?: string }>();
    if (!isApiV1HttpPath(requestPathname(req))) {
      return next.handle();
    }

    const source = next.handle();
    return new Observable((subscriber) => {
      const sub = source.subscribe({
        next: (data: unknown) => {
          subscriber.next(shouldSkipWrapping(data) ? data : wrapApiSuccess(data));
        },
        error: (err: unknown) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
      return () => sub.unsubscribe();
    });
  }
}
