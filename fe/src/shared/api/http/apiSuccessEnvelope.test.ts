import { describe, expect, it } from 'vitest';

import { isApiV1SuccessEnvelope, unwrapApiV1SuccessJson } from './apiSuccessEnvelope';

describe('isApiV1SuccessEnvelope', () => {
  it('detects exact success envelopes', () => {
    expect(isApiV1SuccessEnvelope({ status: 'success', data: { id: '1' } })).toBe(true);
    expect(isApiV1SuccessEnvelope({ status: 'success', data: [1], message: 'ok' })).toBe(true);
  });

  it('rejects bare data bodies and non-success envelopes', () => {
    expect(isApiV1SuccessEnvelope({ data: { id: '1' } })).toBe(false);
    expect(isApiV1SuccessEnvelope({ data: { a: 1 }, message: 'ok' })).toBe(false);
    expect(isApiV1SuccessEnvelope({ status: 'error', data: { id: '1' } })).toBe(false);
  });

  it('rejects envelopes with extra keys', () => {
    expect(isApiV1SuccessEnvelope({ status: 'success', data: { a: 1 }, extra: true })).toBe(false);
  });

  it('rejects arrays and null', () => {
    expect(isApiV1SuccessEnvelope([1])).toBe(false);
    expect(isApiV1SuccessEnvelope(null)).toBe(false);
  });
});

describe('unwrapApiV1SuccessJson', () => {
  it('unwraps exact success envelopes', () => {
    expect(unwrapApiV1SuccessJson({ status: 'success', data: { id: '1' } })).toEqual({ id: '1' });
    expect(unwrapApiV1SuccessJson({ status: 'success', data: { a: 1 }, message: 'ok' })).toEqual({ a: 1 });
  });

  it('leaves bare data bodies unchanged', () => {
    expect(unwrapApiV1SuccessJson({ data: { id: '1' } })).toEqual({ data: { id: '1' } });
    expect(unwrapApiV1SuccessJson({ data: { a: 1 }, message: 'ok' })).toEqual({ data: { a: 1 }, message: 'ok' });
  });

  it('leaves non-envelope bodies unchanged', () => {
    expect(unwrapApiV1SuccessJson({ id: '1', title: 'x' })).toEqual({ id: '1', title: 'x' });
    expect(unwrapApiV1SuccessJson({ status: 'success', data: { a: 1 }, extra: true })).toEqual({
      status: 'success',
      data: { a: 1 },
      extra: true,
    });
    expect(unwrapApiV1SuccessJson([1])).toEqual([1]);
    expect(unwrapApiV1SuccessJson(null)).toBe(null);
  });
});
