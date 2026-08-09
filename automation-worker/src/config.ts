export type WorkerConfig = {
  port: number;
  backendUrl: string;
  token: string;
  workerId: string;
  headless: boolean;
  heartbeatIntervalMs: number;
};

const booleanValue = (value: string | undefined, fallback: boolean) => {
  if (value == null) return fallback;
  return value.toLowerCase() === 'true';
};

export const config: WorkerConfig = {
  port: Number(process.env.WORKER_PORT ?? 3001),
  backendUrl: (process.env.BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, ''),
  token: process.env.WORKER_TOKEN ?? 'token-local-altere',
  workerId: process.env.WORKER_ID ?? `playwright-${process.env.HOSTNAME ?? 'local'}`,
  headless: booleanValue(process.env.BROWSER_HEADLESS, true),
  heartbeatIntervalMs: Number(process.env.HEARTBEAT_INTERVAL_MS ?? 30_000),
};
