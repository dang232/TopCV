import { describe, expect, it } from 'vitest';

import { ApiHttpError, toUserFacingMessage } from './apiClient';
import { buildUserFacingHttpErrorMessage, extractRestErrorFromBody } from './restApiError';

describe('extractRestErrorFromBody', () => {
  it('reads nested error code and message', () => {
    expect(extractRestErrorFromBody({ error: { code: 'WRONG_CREDENTIALS', message: 'Wrong username or password' } })).toEqual({
      code: 'WRONG_CREDENTIALS',
      message: 'Wrong username or password',
    });
  });

  it('returns empty object for non-object or missing error', () => {
    expect(extractRestErrorFromBody(null)).toEqual({});
    expect(extractRestErrorFromBody({})).toEqual({});
  });

  it('reads flat forms-style { code, message }', () => {
    expect(extractRestErrorFromBody({ code: 'NOT_FOUND', message: 'Form not found' })).toEqual({
      code: 'NOT_FOUND',
      message: 'Form not found',
    });
  });

  it('reads first string from Nest validation message array', () => {
    expect(extractRestErrorFromBody({ statusCode: 400, message: ['a is required', 'b is bad'] })).toEqual({
      message: 'a is required',
    });
  });
});

describe('buildUserFacingHttpErrorMessage', () => {
  it('uses safe server message when present', () => {
    expect(buildUserFacingHttpErrorMessage(401, { error: { code: 'X', message: 'Session expired.' } }, 'Session expired.')).toBe(
      'Session expired.',
    );
  });

  it('falls back to status guidance when message missing', () => {
    expect(buildUserFacingHttpErrorMessage(403, {}, undefined)).toBe('You do not have permission to do that.');
  });

  it('replaces unsafe HTML-like payloads with status guidance', () => {
    const html = '<!DOCTYPE html><html><title>502</title></html>';
    expect(buildUserFacingHttpErrorMessage(502, { error: { message: html } }, html)).toBe(
      'The authentication service is temporarily unavailable. Please try again shortly.',
    );
  });
});

describe('toUserFacingMessage', () => {
  it('maps ApiHttpError using shared extraction rules', () => {
    const err = new ApiHttpError(
      401,
      { error: { code: 'WRONG_CREDENTIALS', message: 'Wrong username or password' } },
      'Wrong username or password',
    );
    expect(toUserFacingMessage(err)).toBe('Wrong username or password');
  });

  it('maps network TypeErrors', () => {
    expect(toUserFacingMessage(new TypeError('Failed to fetch'))).toBe(
      'Unable to reach the server. Check your connection and that the API is running.',
    );
  });

  it('falls back for unknown errors', () => {
    expect(toUserFacingMessage({})).toBe('Something went wrong. Please try again.');
  });
});
