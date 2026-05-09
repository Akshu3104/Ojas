/**
 * Retry hook for arbitrary async mutations. Caps attempts and uses exponential
 * backoff; surfaces a `retry()` callback the caller can wire to a button.
 */
import { useCallback, useState } from "react";

interface RetryState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  attempts: number;
}

export function useRetryableMutation<TInput, TOutput>(
  mutator: (input: TInput) => Promise<TOutput>,
  opts: { maxAttempts?: number; baseDelayMs?: number } = {}
): {
  state: RetryState<TOutput>;
  run: (input: TInput) => Promise<TOutput | null>;
  retry: () => Promise<TOutput | null>;
  reset: () => void;
} {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelay = opts.baseDelayMs ?? 500;
  const [state, setState] = useState<RetryState<TOutput>>({
    data: null,
    error: null,
    isLoading: false,
    attempts: 0,
  });
  const [lastInput, setLastInput] = useState<TInput | null>(null);

  const run = useCallback(
    async (input: TInput): Promise<TOutput | null> => {
      setLastInput(input);
      setState({ data: null, error: null, isLoading: true, attempts: 0 });
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const data = await mutator(input);
          setState({ data, error: null, isLoading: false, attempts: attempt });
          return data;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          setState(s => ({ ...s, error: lastError, attempts: attempt }));
          if (attempt < maxAttempts) {
            const delay = Math.min(8000, baseDelay * 2 ** (attempt - 1));
            await new Promise(r => setTimeout(r, delay));
          }
        }
      }
      setState({
        data: null,
        error: lastError,
        isLoading: false,
        attempts: maxAttempts,
      });
      return null;
    },
    [mutator, maxAttempts, baseDelay]
  );

  const retry = useCallback(async (): Promise<TOutput | null> => {
    if (lastInput === null) return null;
    return run(lastInput);
  }, [lastInput, run]);

  const reset = useCallback(() => {
    setLastInput(null);
    setState({ data: null, error: null, isLoading: false, attempts: 0 });
  }, []);

  return { state, run, retry, reset };
}
