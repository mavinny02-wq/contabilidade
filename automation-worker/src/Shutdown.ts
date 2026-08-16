export type TimeoutScheduler = {
  setTimeout: (callback: () => void, delayMs: number) => unknown;
  clearTimeout: (handle: unknown) => void;
};

const systemScheduler: TimeoutScheduler = {
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) => clearTimeout(handle as NodeJS.Timeout),
};

/** Waits for graceful work without leaving the timeout timer behind. */
export async function concluirDentro(
  promise: Promise<unknown>,
  timeoutMs: number,
  scheduler: TimeoutScheduler = systemScheduler,
  onError: (error: unknown) => void = (error) => {
    console.warn('Uma etapa do encerramento terminou com falha.', error);
  },
): Promise<boolean> {
  let timer: unknown;
  try {
    return await Promise.race([
      promise.then(() => true).catch((error) => {
        onError(error);
        return false;
      }),
      new Promise<boolean>((resolve) => {
        timer = scheduler.setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) scheduler.clearTimeout(timer);
  }
}
