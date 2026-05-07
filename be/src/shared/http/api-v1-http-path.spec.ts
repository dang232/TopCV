import { describe, expect, it } from 'vitest';

import { isApiV1HttpPath, requestPathname } from './api-v1-http-path';

describe('api-v1-http-path', () => {
  it('requestPathname', () => {
    expect(requestPathname({ url: '/api/v1/forms?page=1' })).toBe('/api/v1/forms');
    expect(requestPathname({ originalUrl: '/api/v1/auth/login' })).toBe('/api/v1/auth/login');
  });

  it('isApiV1HttpPath', () => {
    expect(isApiV1HttpPath('/api/v1')).toBe(true);
    expect(isApiV1HttpPath('/api/v1/forms')).toBe(true);
    expect(isApiV1HttpPath('/health')).toBe(false);
    expect(isApiV1HttpPath('/rpc')).toBe(false);
  });
});
