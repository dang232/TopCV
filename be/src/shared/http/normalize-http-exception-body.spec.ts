import { describe, expect, it } from 'vitest';

import { normalizeHttpExceptionBody } from './normalize-http-exception-body';

describe('normalizeHttpExceptionBody', () => {
  it('passes through restHttpException shape', () => {
    const body = { error: { code: 'CONFLICT', message: 'Taken', details: { x: 1 } } };
    expect(normalizeHttpExceptionBody(409, body)).toEqual(body);
  });

  it('passes through forms REST flat shape', () => {
    const body = { code: 'NOT_FOUND', message: 'Missing', data: { formId: 'a' } };
    expect(normalizeHttpExceptionBody(404, body)).toEqual(body);
  });

  it('string payload', () => {
    expect(normalizeHttpExceptionBody(400, 'bad')).toEqual({
      error: { code: 'HTTP_400', message: 'bad' },
    });
  });

  it('Nest validation-style payload', () => {
    expect(
      normalizeHttpExceptionBody(400, {
        statusCode: 400,
        message: ['a is bad', 'b is worse'],
        error: 'Bad Request',
      }),
    ).toEqual({
      error: {
        code: 'BAD_REQUEST',
        message: 'a is bad; b is worse',
        details: { fields: ['a is bad', 'b is worse'] },
      },
    });
  });
});
