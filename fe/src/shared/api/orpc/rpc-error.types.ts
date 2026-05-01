export type ApiRpcFailureProps = {
  code: string;
  status: number;
  message: string;
  data?: unknown;
  defined?: boolean;
};
