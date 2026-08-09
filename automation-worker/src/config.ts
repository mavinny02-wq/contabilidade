export type WorkerConfig = {
  port: number;
  backendUrl: string;
  token: string;
  workerId: string;
  headless: boolean;
  heartbeatIntervalMs: number;
  pollIntervalMs: number;
  leaseSeconds: number;
};

const booleanValue = (value: string | undefined, fallback: boolean) => {
  if (value == null) return fallback;
  return value.toLowerCase() === 'true';
};

const integerValue = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), min), max) : fallback;
};

export const config: WorkerConfig = {
  port: integerValue(process.env.WORKER_PORT, 3001, 1, 65535),
  backendUrl: (process.env.BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, ''),
  token: process.env.WORKER_TOKEN ?? 'token-local-altere',
  workerId: process.env.WORKER_ID ?? `playwright-${process.env.HOSTNAME ?? 'local'}`,
  headless: booleanValue(process.env.BROWSER_HEADLESS, true),
  heartbeatIntervalMs: integerValue(process.env.HEARTBEAT_INTERVAL_MS, 30_000, 5_000, 300_000),
  pollIntervalMs: integerValue(process.env.POLL_INTERVAL_MS, 5_000, 500, 60_000),
  leaseSeconds: integerValue(process.env.LEASE_SECONDS, 180, 30, 1_800),
};
