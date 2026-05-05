import { describe, expect, it } from 'vitest';

import { isApiV1SuccessEnvelope, unwrapApiV1SuccessJson } from './apiSuccessEnvelope';

describe('isApiV1SuccessEnvelope', () => {
  it('detects canonical envelope', () => {
    expect(isApiV1SuccessEnvelope({ status: 'success', data: { id: '1' } })).toBe(true);
    expect(isApiV1SuccessEnvelope({ data: { id: '1' } })).toBe(true);
    expect(isApiV1SuccessEnvelope({ data: [1] })).toBe(true);
  });

  it('rejects non-envelopes', () => {
    expect(isApiV1SuccessEnvelope({ id: '1', title: 'x' })).toBe(false);
    expect(isApiV1SuccessEnvelope({ data: { a: 1 }, extra: true })).toBe(false);
    expect(isApiV1SuccessEnvelope(null)).toBe(false);
  });
});

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
