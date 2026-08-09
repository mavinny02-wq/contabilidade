export type SerproConfig = {
  tokenUrl: string;
  apiUrl: string;
  consumerKey?: string;
  consumerSecret?: string;
  staticBearerToken?: string;
  allowStaticBearer: boolean;
  requestTag?: string;
  httpTimeoutMs: number;
  processingTimeoutMs: number;
  pollIntervalMs: number;
  maxPdfBytes: number;
};

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
  sefazSpPortalUrl: string;
  sefazSpNavigationTimeoutMs: number;
  sefazSpResultTimeoutMs: number;
  sefazSpEnforceServiceWindow: boolean;
  pgeSpPortalUrl: string;
  pgeSpNavigationTimeoutMs: number;
  pgeSpResultTimeoutMs: number;
  downloadDirectory: string;
  serpro: SerproConfig;
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

const optionalTrimmed = (value: string | undefined): string | undefined => {
  const clean = value?.trim();
  return clean ? clean : undefined;
};

const requiredSecret = (value: string | undefined, localFallback: string): string => {
  const effective = value ?? localFallback;
  if (effective.length < 32) {
    throw new Error('APP_AUTOMATION_SESSION_SIGNING_SECRET deve possuir ao menos 32 caracteres.');
  }
  return effective;
};

const requestTag = (value: string | undefined): string | undefined => {
  const clean = optionalTrimmed(value)?.replace(/[\r\n\u0000-\u001f\u007f]/g, '');
  if (!clean) return undefined;
  return clean.slice(0, 32);
};

export const config: WorkerConfig = {
  port: integerValue(process.env.WORKER_PORT, 3001, 1, 65_535),
  backendUrl: normalizedUrl(process.env.BACKEND_URL ?? 'http://localhost:8080'),
  token: process.env.WORKER_TOKEN ?? 'token-local-altere',
  workerId: process.env.WORKER_ID ?? `integracao-${process.env.HOSTNAME ?? 'local'}`,
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
  sefazSpPortalUrl: normalizedUrl(
    process.env.SEFAZ_SP_PORTAL_URL
      ?? 'https://www10.fazenda.sp.gov.br/CertidaoNegativaDeb/Pages/EmissaoCertidaoNegativa.aspx',
  ),
  sefazSpNavigationTimeoutMs: integerValue(
    process.env.SEFAZ_SP_PORTAL_NAVIGATION_TIMEOUT_MS,
    60_000,
    10_000,
    300_000,
  ),
  sefazSpResultTimeoutMs: integerValue(
    process.env.SEFAZ_SP_PORTAL_RESULT_TIMEOUT_MS,
    120_000,
    15_000,
    600_000,
  ),
  sefazSpEnforceServiceWindow: booleanValue(
    process.env.SEFAZ_SP_ENFORCE_SERVICE_WINDOW,
    true,
  ),
  pgeSpPortalUrl: normalizedUrl(
    process.env.PGE_SP_PORTAL_URL
      ?? 'https://www.dividaativa.pge.sp.gov.br/sc/pages/crda/emitirCrda.jsf',
  ),
  pgeSpNavigationTimeoutMs: integerValue(
    process.env.PGE_SP_PORTAL_NAVIGATION_TIMEOUT_MS,
    60_000,
    10_000,
    300_000,
  ),
  pgeSpResultTimeoutMs: integerValue(
    process.env.PGE_SP_PORTAL_RESULT_TIMEOUT_MS,
    120_000,
    15_000,
    600_000,
  ),
  downloadDirectory:
    process.env.WORKER_DOWNLOAD_DIRECTORY ?? '/tmp/contabilidade-downloads',
  serpro: {
    tokenUrl: normalizedUrl(
      process.env.SERPRO_CND_TOKEN_URL
        ?? 'https://gateway.apiserpro.serpro.gov.br/token',
    ),
    apiUrl: normalizedUrl(
      process.env.SERPRO_CND_API_URL
        ?? 'https://gateway.apiserpro.serpro.gov.br/consulta-cnd/v1/certidao',
    ),
    consumerKey: optionalTrimmed(process.env.SERPRO_CND_CONSUMER_KEY),
    consumerSecret: optionalTrimmed(process.env.SERPRO_CND_CONSUMER_SECRET),
    staticBearerToken: optionalTrimmed(process.env.SERPRO_CND_STATIC_BEARER_TOKEN),
    allowStaticBearer: booleanValue(
      process.env.SERPRO_CND_ALLOW_STATIC_BEARER,
      false,
    ),
    requestTag: requestTag(process.env.SERPRO_CND_REQUEST_TAG),
    httpTimeoutMs: integerValue(
      process.env.SERPRO_CND_HTTP_TIMEOUT_MS,
      30_000,
      5_000,
      120_000,
    ),
    processingTimeoutMs: integerValue(
      process.env.SERPRO_CND_PROCESSING_TIMEOUT_MS,
      120_000,
      5_000,
      600_000,
    ),
    pollIntervalMs: integerValue(
      process.env.SERPRO_CND_POLL_INTERVAL_MS,
      750,
      500,
      30_000,
    ),
    maxPdfBytes: integerValue(
      process.env.SERPRO_CND_MAX_PDF_BYTES,
      10 * 1024 * 1024,
      100 * 1024,
      50 * 1024 * 1024,
    ),
  },
};

function federalPortalUrl(value: string): string {
  const clean = normalizedUrl(value);
  return clean.includes('#/') ? clean : `${clean}/#/home/cnpj`;
}

function normalizedUrl(value: string): string {
  return value.trim().replace(/\/$/, '');
}
