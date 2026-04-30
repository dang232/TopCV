import { ORPCError } from '@orpc/client';
import { OrpcCommonErrorCode } from '@topcv/shared';

/** Normalized failure from an RPC call (or a non-ORPC throw). */
export type ApiRpcFailureProps = {
  code: string;
  status: number;
  message: string;
  data?: unknown;
  /**
   * From oRPC: `true` when the server intentionally surfaced this error shape to the client
   * (e.g. dev details for INTERNAL_SERVER_ERROR, or a declared procedure error like FORM_NOT_FOUND).
   */
  defined?: boolean;
};

export class ApiRpcFailure implements ApiRpcFailureProps {
  readonly code: string;

  readonly status: number;

  readonly message: string;

  readonly data?: unknown;

  readonly defined?: boolean;

  constructor(init: ApiRpcFailureProps) {
    this.code = init.code;
    this.status = init.status;
    this.message = init.message;
    this.data = init.data;
    this.defined = init.defined;
  }

  /**
   * Whether to show “check Docker / NEXT_PUBLIC_ORPC_URL / …” style hints.
   * Uses {@link ApiRpcFailureProps.defined}, not substring checks on `message`:
   * in production, internal errors keep `defined: false`; in dev, detailed internals use `defined: true`.
   */
  suggestsInfrastructureHint(): boolean {
    return (
      this.code === OrpcCommonErrorCode.InternalServerError && this.status === 500 && this.defined !== true
    );
  }

  static parse(cause: unknown): ApiRpcFailure {
    if (cause instanceof ORPCError) {
      return new ApiRpcFailure({
        code: String(cause.code),
        status: cause.status,
        message: cause.message,
        data: cause.data,
        defined: cause.defined,
      });
    }

    if (cause instanceof Error) {
      return new ApiRpcFailure({ code: 'UNKNOWN', status: 0, message: cause.message });
    }

    if (typeof cause === 'string') {
      return new ApiRpcFailure({ code: 'UNKNOWN', status: 0, message: cause });
    }

    return new ApiRpcFailure({ code: 'UNKNOWN', status: 0, message: 'Request failed' });
  }
}
