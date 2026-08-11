const integerValue = (
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
) => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed)
    ? Math.min(Math.max(Math.trunc(parsed), min), max)
    : fallback;
};

export const shutdownConfig = {
  gracePeriodMs: integerValue(
    process.env.WORKER_SHUTDOWN_GRACE_PERIOD_MS,
    120_000,
    5_000,
    30 * 60_000,
  ),
  serverCloseTimeoutMs: integerValue(
    process.env.WORKER_SHUTDOWN_SERVER_CLOSE_TIMEOUT_MS,
    10_000,
    1_000,
    60_000,
  ),
};
