import { describe, expect, it } from 'vitest';

import { unwrapApiV1SuccessJson } from './apiSuccessEnvelope';

describe('unwrapApiV1SuccessJson', () => {
  it('unwraps canonical envelope', () => {
    expect(unwrapApiV1SuccessJson({ data: { id: '1' } })).toEqual({ id: '1' });
    expect(unwrapApiV1SuccessJson({ data: { a: 1 }, message: 'ok' })).toEqual({ a: 1 });
  });

  it('leaves legacy or non-envelope bodies unchanged', () => {
    expect(unwrapApiV1SuccessJson({ id: '1', title: 'x' })).toEqual({ id: '1', title: 'x' });
    expect(unwrapApiV1SuccessJson([1])).toEqual([1]);
    expect(unwrapApiV1SuccessJson(null)).toBe(null);
  });
});
