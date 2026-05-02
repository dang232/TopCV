import { describe, expect, it } from 'vitest';

import { getJwtExpiryEpochMs, isAccessNearExpiry, isSessionExpired } from './jwt';

function b64url(obj: unknown): string {
  const json = JSON.stringify(obj);
  const b64 = Buffer.from(json, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fakeJwt(payload: { exp?: number }): string {
  return `e30.${b64url(payload)}.sig`;
}

describe('getJwtExpiryEpochMs', () => {
  it('returns exp * 1000', () => {
    const expSec = 1700000000;
    expect(getJwtExpiryEpochMs(fakeJwt({ exp: expSec }))).toBe(expSec * 1000);
  });

  it('returns undefined for malformed token', () => {
    expect(getJwtExpiryEpochMs('not-a-jwt')).toBeUndefined();
  });
});

describe('isSessionExpired', () => {
  it('uses expiresAtEpochMs when set', () => {
    const past = Date.now() - 60_000;
    expect(isSessionExpired({ accessToken: 'x', expiresAtEpochMs: past })).toBe(true);
    expect(isSessionExpired({ accessToken: 'x', expiresAtEpochMs: Date.now() + 60_000 })).toBe(false);
  });

  it('falls back to JWT exp', () => {
    const pastSec = Math.floor(Date.now() / 1000) - 120;
    const futureSec = Math.floor(Date.now() / 1000) + 3600;
    expect(isSessionExpired({ accessToken: fakeJwt({ exp: pastSec }) })).toBe(true);
    expect(isSessionExpired({ accessToken: fakeJwt({ exp: futureSec }) })).toBe(false);
  });

  it('treats missing exp as not expired', () => {
    expect(isSessionExpired({ accessToken: fakeJwt({}) })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isSessionExpired(null)).toBe(false);
  });
});

describe('isAccessNearExpiry', () => {
  it('is true within skew of JWT exp', () => {
    const expSec = Math.floor(Date.now() / 1000) + 30;
    expect(isAccessNearExpiry({ accessToken: fakeJwt({ exp: expSec }) }, 60_000)).toBe(true);
  });

  it('is false far before JWT exp', () => {
    const expSec = Math.floor(Date.now() / 1000) + 3600;
    expect(isAccessNearExpiry({ accessToken: fakeJwt({ exp: expSec }) }, 60_000)).toBe(false);
  });

  it('uses expiresAtEpochMs when set', () => {
    const soon = Date.now() + 30_000;
    expect(isAccessNearExpiry({ accessToken: 'x', expiresAtEpochMs: soon }, 60_000)).toBe(true);
  });
});
