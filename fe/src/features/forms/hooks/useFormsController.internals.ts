import { useCallback } from 'react';

import { ApiRpcFailure } from '@/src/lib/rpcError';

export function useFormsControllerInternals(init: {
  setMessage(message: string): void;
  setError(error: string): void;
  infraHint: string;
}) {
  const clearNotices = useCallback(() => {
    init.setMessage('');
    init.setError('');
  }, [init]);

  const showFailure = useCallback(
    (cause: unknown) => {
      const failure = ApiRpcFailure.parse(cause);
      init.setError(`${failure.message}${failure.suggestsInfrastructureHint() ? `. ${init.infraHint}` : ''}`);
    },
    [init],
  );

  const runApi = useCallback(
    async (fn: () => Promise<unknown>) => {
      try {
        await fn();
        return true;
      } catch (cause: unknown) {
        showFailure(cause);
        return false;
      }
    },
    [showFailure],
  );

  const runApiResult = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      try {
        return await fn();
      } catch (cause: unknown) {
        showFailure(cause);
        return undefined;
      }
    },
    [showFailure],
  );

  return { clearNotices, runApi, runApiResult };
}

