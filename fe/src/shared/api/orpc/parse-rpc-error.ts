import { ORPCError } from '@orpc/client';

import { ApiHttpError } from '../http/apiClient';
import { ApiContractViolationError } from '../http/apiContractViolation';

import type { ApiRpcFailureProps } from './rpc-error.types';

/**
 * Maps unknown errors to serializable RPC failure props (no domain types).
 */
export function parseRpcErrorProps(cause: unknown): ApiRpcFailureProps {
  if (cause instanceof ApiHttpError) {
    const body = cause.body;
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : cause.message;
    const code =
      typeof body === 'object' && body !== null && 'code' in body
        ? String((body as { code: unknown }).code)
        : `HTTP_${cause.status}`;
    return {
      code,
      status: cause.status,
      message,
      data: body,
      defined: true,
    };
  }

  if (cause instanceof ORPCError) {
    return {
      code: String(cause.code),
      status: cause.status,
      message: cause.message,
      data: cause.data,
      defined: cause.defined,
    };
  }

  if (cause instanceof ApiContractViolationError) {
    return {
      code: 'CONTRACT_VIOLATION',
      status: 0,
      message: cause.message,
      data: { route: cause.route, issues: cause.issues },
      defined: true,
    };
  }

  if (cause instanceof Error) {
    return { code: 'UNKNOWN', status: 0, message: cause.message };
  }

  if (typeof cause === 'string') {
    return { code: 'UNKNOWN', status: 0, message: cause };
  }

  return { code: 'UNKNOWN', status: 0, message: 'Request failed' };
}
