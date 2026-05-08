import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';

import { devErrorDetails, makeRestError } from './rest-error';
import { normalizeHttpExceptionBody } from './normalize-http-exception-body';
import { isApiV1HttpPath, requestPathname } from './api-v1-http-path';

@Catch()
export class ApiExceptionFilter extends BaseExceptionFilter {
  private readonly log = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      super.catch(exception, host);
      return;
    }

    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<{ originalUrl?: string; url?: string }>();

    if (res.headersSent) {
      super.catch(exception, host);
      return;
    }

    if (!isApiV1HttpPath(requestPathname(req))) {
      super.catch(exception, host);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const body = normalizeHttpExceptionBody(status, typeof raw === 'string' || typeof raw === 'object' ? raw : String(raw));
      res.status(status).json(body);
      return;
    }

    this.log.error(`Unhandled error on ${req.url ?? ''}`, exception instanceof Error ? exception.stack : String(exception));
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(makeRestError('INTERNAL', 'Something went wrong.', devErrorDetails(exception)));
  }
}
