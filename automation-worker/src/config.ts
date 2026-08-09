export type WorkerConfig = {
  port: number;
  backendUrl: string;
  token: string;
  workerId: string;
  headless: boolean;
  heartbeatIntervalMs: number;
  pollIntervalMs: number;
  leaseSeconds: number;
  sessionSigningSecret: string;
  federalPortalUrl: string;
  federalNavigationTimeoutMs: number;
  federalResultTimeoutMs: number;
  downloadDirectory: string;
};

const booleanValue = (value: string | undefined, fallback: boolean) => {
  if (value == null) return fallback;
  return value.toLowerCase() === 'true';
};

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

const requiredSecret = (value: string | undefined, localFallback: string): string => {
  const effective = value ?? localFallback;
  if (effective.length < 32) {
    throw new Error('APP_AUTOMATION_SESSION_SIGNING_SECRET deve possuir ao menos 32 caracteres.');
  }
  return effective;
};

export const config: WorkerConfig = {
  port: integerValue(process.env.WORKER_PORT, 3001, 1, 65_535),
  backendUrl: (process.env.BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, ''),
  token: process.env.WORKER_TOKEN ?? 'token-local-altere',
  workerId: process.env.WORKER_ID ?? `playwright-${process.env.HOSTNAME ?? 'local'}`,
  headless: booleanValue(process.env.BROWSER_HEADLESS, true),
  heartbeatIntervalMs: integerValue(
    process.env.HEARTBEAT_INTERVAL_MS,
    30_000,
    5_000,
    300_000,
  ),
  pollIntervalMs: integerValue(process.env.POLL_INTERVAL_MS, 5_000, 500, 60_000),
  leaseSeconds: integerValue(process.env.LEASE_SECONDS, 180, 30, 1_800),
  sessionSigningSecret: requiredSecret(
    process.env.APP_AUTOMATION_SESSION_SIGNING_SECRET
      ?? process.env.AUTOMATION_SESSION_SIGNING_SECRET,
    'local-session-signing-secret-altere-1234567890',
  ),
  federalPortalUrl: federalPortalUrl(
    process.env.FEDERAL_CERTIFICATE_PORTAL_URL
      ?? process.env.FEDERAL_PORTAL_URL
      ?? 'https://servicos.receitafederal.gov.br/servico/certidoes',
  ),
  federalNavigationTimeoutMs: integerValue(
    process.env.FEDERAL_NAVIGATION_TIMEOUT_MS
      ?? process.env.FEDERAL_PORTAL_NAVIGATION_TIMEOUT_MS,
    60_000,
    10_000,
    300_000,
  ),
  federalResultTimeoutMs: integerValue(
    process.env.FEDERAL_RESULT_TIMEOUT_MS
      ?? process.env.FEDERAL_PORTAL_RESULT_TIMEOUT_MS,
    120_000,
    15_000,
    600_000,
  ),
  downloadDirectory: process.env.WORKER_DOWNLOAD_DIRECTORY ?? '/tmp/contabilidade-downloads',
};

function federalPortalUrl(value: string): string {
  const clean = value.trim().replace(/\/$/, '');
  return clean.includes('#/') ? clean : `${clean}/#/home/cnpj`;
}
