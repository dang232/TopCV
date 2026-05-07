import { describe, expect, it } from 'vitest';

import { isApiSuccessEnvelope, wrapApiSuccess } from './api-success';

describe('api-success', () => {
  it('wrapApiSuccess', () => {
    expect(wrapApiSuccess({ id: '1' })).toEqual({ status: 'success', data: { id: '1' } });
    expect(wrapApiSuccess({ id: '1' }, 'ok')).toEqual({ status: 'success', data: { id: '1' }, message: 'ok' });
    expect(wrapApiSuccess(undefined)).toEqual({ status: 'success', data: null });
  });

  it('wraps domain payloads with data and message inside the success envelope', () => {
    expect(wrapApiSuccess({ data: { id: '1' }, message: 'domain message' })).toEqual({
      status: 'success',
      data: { data: { id: '1' }, message: 'domain message' },
    });
  });

  it('isApiSuccessEnvelope', () => {
    expect(isApiSuccessEnvelope({ data: 1 })).toBe(false);
    expect(isApiSuccessEnvelope({ status: 'success', data: 1 })).toBe(true);
    expect(isApiSuccessEnvelope({ status: 'success', data: null, message: 'x' })).toBe(true);
    expect(isApiSuccessEnvelope({ status: 'error', data: 1 })).toBe(false);
    expect(isApiSuccessEnvelope({ message: 'only' })).toBe(false);
    expect(isApiSuccessEnvelope(null)).toBe(false);
    expect(isApiSuccessEnvelope([1])).toBe(false);
  });
});
