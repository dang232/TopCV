import { describe, expect, it } from 'vitest';
import { ORPCError } from '@orpc/server';
import { z } from 'zod';
import { FormsOrpcErrorCode, formsProcedureFormLookupErrors } from '@topcv/shared/forms';

import { FormNotFound } from '../domain/errors/form-not-found';
import { mapFormsFailureToOrpc } from './forms-orpc-error.mapper';

describe('mapFormsFailureToOrpc', () => {
  it('passes through ORPCError', () => {
    const err = new ORPCError('SOME_CODE', { status: 400, message: 'Bad' });
    expect(mapFormsFailureToOrpc(err)).toBe(err);
  });

  it('maps ZodError to UNPROCESSABLE_CONTENT with status 422', () => {
    const schema = z.object({ name: z.string().min(3) });
    let zod: z.ZodError;
    try {
      schema.parse({ name: 'x' });
      throw new Error('Expected parse to throw');
    } catch (e) {
      if (!(e instanceof z.ZodError)) throw e;
      zod = e;
    }

    const mapped = mapFormsFailureToOrpc(zod);
    expect(mapped).toBeInstanceOf(ORPCError);
    expect(mapped?.code).toBe('UNPROCESSABLE_CONTENT');
    expect(mapped?.status).toBe(422);
    expect(mapped?.defined).toBe(true);
  });

  it('maps FormNotFound to the shared contract code + status', () => {
    const err = new FormNotFound('form-123');
    const mapped = mapFormsFailureToOrpc(err);
    expect(mapped).toBeInstanceOf(ORPCError);
    expect(mapped?.code).toBe(FormsOrpcErrorCode.FormNotFound);
    expect(mapped?.status).toBe(formsProcedureFormLookupErrors[FormsOrpcErrorCode.FormNotFound].status);
    expect(mapped?.defined).toBe(true);
    expect(mapped?.data).toEqual({ resource: 'form', id: 'form-123' });
  });

  it('returns undefined for unknown failures', () => {
    expect(mapFormsFailureToOrpc(new Error('nope'))).toBeUndefined();
  });
});

