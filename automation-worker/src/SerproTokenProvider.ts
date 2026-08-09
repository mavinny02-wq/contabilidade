import { config } from './config.js';

type TokenResponse = {
  access_token?: unknown;
  token_type?: unknown;
  expires_in?: unknown;
};

type CachedToken = {
  value: string;
  expiresAt: number;
};

export class SerproTokenProvider {
  private cached?: CachedToken;
  private inFlight?: Promise<string>;

  configurado(): boolean {
    return Boolean(
      (config.serpro.allowStaticBearer && config.serpro.staticBearerToken)
      || (config.serpro.consumerKey && config.serpro.consumerSecret),
    );
  }

  modoAutenticacao(): 'BEARER_ESTATICO' | 'OAUTH2_CLIENT_CREDENTIALS' | 'NAO_CONFIGURADO' {
    if (config.serpro.allowStaticBearer && config.serpro.staticBearerToken) {
      return 'BEARER_ESTATICO';
    }
    if (config.serpro.consumerKey && config.serpro.consumerSecret) {
      return 'OAUTH2_CLIENT_CREDENTIALS';
    }
    return 'NAO_CONFIGURADO';
  }

  invalidar(): void {
    this.cached = undefined;
  }

  async obter(forceRefresh = false): Promise<string> {
    if (config.serpro.allowStaticBearer && config.serpro.staticBearerToken) {
      return config.serpro.staticBearerToken;
    }
    if (!config.serpro.consumerKey || !config.serpro.consumerSecret) {
      throw new SerproConfigurationError('SERPRO_CREDENCIAIS_NAO_CONFIGURADAS');
    }

    if (!forceRefresh && this.cached && this.cached.expiresAt > Date.now()) {
      return this.cached.value;
    }
    if (!forceRefresh && this.inFlight) return this.inFlight;

    this.inFlight = this.solicitar();
    try {
      return await this.inFlight;
    } finally {
      this.inFlight = undefined;
    }
  }

  private async solicitar(): Promise<string> {
    const key = config.serpro.consumerKey;
    const secret = config.serpro.consumerSecret;
    if (!key || !secret) {
      throw new SerproConfigurationError('SERPRO_CREDENCIAIS_NAO_CONFIGURADAS');
    }

    const basic = Buffer.from(`${key}:${secret}`, 'utf8').toString('base64');
    let response: Response;
    try {
      response = await fetch(config.serpro.tokenUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(config.serpro.httpTimeoutMs),
      });
    } catch (error) {
      throw new SerproTokenError(
        'SERPRO_TOKEN_INDISPONIVEL',
        resumoSeguro(error),
        true,
      );
    }

    if (!response.ok) {
      throw new SerproTokenError(
        response.status === 401 || response.status === 403
          ? 'SERPRO_CREDENCIAIS_REJEITADAS'
          : 'SERPRO_TOKEN_REJEITADO',
        `HTTP ${response.status}`,
        response.status >= 500 || response.status === 429,
      );
    }

    let body: TokenResponse;
    try {
      body = await response.json() as TokenResponse;
    } catch {
      throw new SerproTokenError(
        'SERPRO_TOKEN_RESPOSTA_INVALIDA',
        'A resposta do endpoint de token não é JSON.',
        false,
      );
    }

    const token = typeof body.access_token === 'string'
      ? body.access_token.trim()
      : '';
    if (!token) {
      throw new SerproTokenError(
        'SERPRO_TOKEN_AUSENTE',
        'O endpoint de token não retornou access_token.',
        false,
      );
    }

    const expiresIn = numeroPositivo(body.expires_in, 300);
    const safetyWindowMs = Math.min(60_000, Math.max(5_000, expiresIn * 100));
    this.cached = {
      value: token,
      expiresAt: Date.now() + expiresIn * 1_000 - safetyWindowMs,
    };
    return token;
  }
}

export class SerproConfigurationError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'SerproConfigurationError';
  }
}

export class SerproTokenError extends Error {
  constructor(
    readonly code: string,
    readonly safeDetail: string,
    readonly retryable: boolean,
  ) {
    super(`${code}: ${safeDetail}`);
    this.name = 'SerproTokenError';
  }
}

function numeroPositivo(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resumoSeguro(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError') return 'Timeout ao obter token.';
    return `${error.name}: ${error.message}`.slice(0, 200);
  }
  return String(error).slice(0, 200);
}
