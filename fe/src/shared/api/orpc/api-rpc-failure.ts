import { OrpcCommonErrorCode } from '@topcv/shared';

import { parseRpcErrorProps } from './parse-rpc-error';
import type { ApiRpcFailureProps } from './rpc-error.types';

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

  suggestsInfrastructureHint(): boolean {
    if (this.status >= 502 || this.status === 0) {
      return true;
    }
    return (
      this.code === OrpcCommonErrorCode.InternalServerError && this.status === 500 && this.defined !== true
    );
  }

  static parse(cause: unknown): ApiRpcFailure {
    return new ApiRpcFailure(parseRpcErrorProps(cause));
  }
}
