import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { config } from './config.js';

export type SessionTicketPayload = {
  sid: string;
  iid: string;
  eid: string;
  sub: string;
  exp: number;
  jti: string;
};

export type SessionTicketConsumer = (
  payload: SessionTicketPayload,
) => Promise<'CONSUMED' | 'REPLAY'>;

export type SessionTicketAuthentication = {
  payload: SessionTicketPayload;
  setCookie?: string;
};

type AuthenticationInput = {
  ticket: string | undefined;
  expectedSessionId: string;
  cookieHeader: string | undefined;
  secureCookie: boolean;
};

type SessionGrant = {
  payload: SessionTicketPayload;
  expiresAt: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_ACTIVE_GRANTS = 4096;
const MAX_TICKET_LENGTH = 4096;
const MAX_PAYLOAD_LENGTH = 2048;
const MAX_SIGNATURE_LENGTH = 128;

export class SessionTicketVerifier {
  private readonly grants = new Map<string, SessionGrant>();
  private readonly grantKeyBySession = new Map<string, string>();

  constructor(private readonly consumeJti: SessionTicketConsumer) {}

  async authenticate(input: AuthenticationInput): Promise<SessionTicketAuthentication> {
    const now = Math.floor(Date.now() / 1000);
    this.prune(now);

    const sessionKey = input.expectedSessionId.toLowerCase();
    const cookieName = grantCookieName(sessionKey);

    // Um ticket explicitamente apresentado sempre é consumido e rotaciona o grant.
    // Isso evita deixar um jti novo e ainda reutilizável quando a sessão já possui cookie.
    if (input.ticket) {
      const payload = this.verifySignedTicket(input.ticket, sessionKey, now);

      let consumption: 'CONSUMED' | 'REPLAY';
      try {
        consumption = await this.consumeJti(payload);
      } catch {
        throw new TicketError('TICKET_VALIDACAO_INDISPONIVEL', 503);
      }
      if (consumption === 'REPLAY') {
        throw new TicketError('TICKET_REUTILIZADO');
      }

      // Há no máximo um grant ativo por sessão. A troca de um ticket novo
      // revoga grants anteriores mesmo quando vieram de outra aba do navegador.
      const grantKeyAnterior = this.grantKeyBySession.get(sessionKey);
      if (grantKeyAnterior) this.grants.delete(grantKeyAnterior);

      const grantTokenNovo = randomBytes(32).toString('base64url');
      const grantKeyNovo = hashGrant(grantTokenNovo);
      this.grants.set(grantKeyNovo, {
        payload,
        expiresAt: payload.exp,
      });
      this.grantKeyBySession.set(sessionKey, grantKeyNovo);
      this.trimGrants();

      return {
        payload,
        setCookie: buildGrantCookie(
          cookieName,
          grantTokenNovo,
          sessionKey,
          payload.exp,
          now,
          input.secureCookie,
        ),
      };
    }

    const grantToken = readCookie(input.cookieHeader, cookieName);
    if (grantToken) {
      const grantKey = hashGrant(grantToken);
      const grant = this.grants.get(grantKey);
      if (
        grant
        && grant.expiresAt > now
        && grant.payload.sid.toLowerCase() === sessionKey
        && this.grantKeyBySession.get(sessionKey) === grantKey
      ) {
        return { payload: grant.payload };
      }
      this.deleteGrant(grantKey, grant?.payload.sid.toLowerCase() ?? sessionKey);
    }

    throw new TicketError('TICKET_AUSENTE');
  }

  private verifySignedTicket(
    ticket: string,
    expectedSessionId: string,
    now: number,
  ): SessionTicketPayload {
    if (ticket.length > MAX_TICKET_LENGTH) throw new TicketError('TICKET_INVALIDO');

    const parts = ticket.split('.');
    if (parts.length !== 2) throw new TicketError('TICKET_INVALIDO');

    const [payloadEncoded, signatureEncoded] = parts;
    if (
      !payloadEncoded
      || !signatureEncoded
      || payloadEncoded.length > MAX_PAYLOAD_LENGTH
      || signatureEncoded.length > MAX_SIGNATURE_LENGTH
      || !BASE64_URL_PATTERN.test(payloadEncoded)
      || !BASE64_URL_PATTERN.test(signatureEncoded)
    ) {
      throw new TicketError('TICKET_INVALIDO');
    }

    const expected = createHmac('sha256', config.sessionSigningSecret)
      .update(payloadEncoded, 'ascii')
      .digest();
    const received = decodeBase64Url(signatureEncoded);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new TicketError('TICKET_ASSINATURA_INVALIDA');
    }

    let payload: SessionTicketPayload;
    try {
      payload = JSON.parse(
        Buffer.from(payloadEncoded, 'base64url').toString('utf8'),
      ) as SessionTicketPayload;
    } catch {
      throw new TicketError('TICKET_PAYLOAD_INVALIDO');
    }

    if (
      typeof payload.sid !== 'string'
      || typeof payload.iid !== 'string'
      || typeof payload.eid !== 'string'
      || typeof payload.sub !== 'string'
      || typeof payload.jti !== 'string'
      || typeof payload.exp !== 'number'
      || !UUID_PATTERN.test(payload.sid)
      || !UUID_PATTERN.test(payload.iid)
      || !UUID_PATTERN.test(payload.eid)
      || !UUID_PATTERN.test(payload.jti)
      || !payload.sub.trim()
      || payload.sub.length > 200
      || !Number.isSafeInteger(payload.exp)
      || payload.sid.toLowerCase() !== expectedSessionId
    ) {
      throw new TicketError('TICKET_PAYLOAD_INVALIDO');
    }
    if (payload.exp <= now) {
      throw new TicketError('TICKET_EXPIRADO');
    }
    return payload;
  }

  private prune(now: number): void {
    for (const [key, grant] of this.grants) {
      if (grant.expiresAt <= now) {
        this.deleteGrant(key, grant.payload.sid.toLowerCase());
      }
    }
  }

  private trimGrants(): void {
    while (this.grants.size > MAX_ACTIVE_GRANTS) {
      const oldest = this.grants.entries().next().value as [string, SessionGrant] | undefined;
      if (!oldest) return;
      this.deleteGrant(oldest[0], oldest[1].payload.sid.toLowerCase());
    }
  }

  private deleteGrant(grantKey: string, sessionKey: string): void {
    this.grants.delete(grantKey);
    if (this.grantKeyBySession.get(sessionKey) === grantKey) {
      this.grantKeyBySession.delete(sessionKey);
    }
  }
}

export class TicketError extends Error {
  constructor(
    readonly code: string,
    readonly status = 401,
  ) {
    super(code);
    this.name = 'TicketError';
  }
}

function decodeBase64Url(value: string): Buffer {
  if (!BASE64_URL_PATTERN.test(value)) throw new TicketError('TICKET_INVALIDO');
  try {
    return Buffer.from(value, 'base64url');
  } catch {
    throw new TicketError('TICKET_INVALIDO');
  }
}

function grantCookieName(sessionId: string): string {
  return `contabilidade_session_${sessionId.replaceAll('-', '')}`;
}

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const item = part.trim();
    const separator = item.indexOf('=');
    if (separator <= 0) continue;
    if (item.slice(0, separator) !== name) continue;
    const value = item.slice(separator + 1);
    return BASE64_URL_PATTERN.test(value) ? value : undefined;
  }
  return undefined;
}

function hashGrant(token: string): string {
  return createHash('sha256').update(token, 'ascii').digest('hex');
}

function buildGrantCookie(
  name: string,
  token: string,
  sessionId: string,
  expiresAt: number,
  now: number,
  secure: boolean,
): string {
  const maxAge = Math.max(1, expiresAt - now);
  const attributes = [
    `${name}=${token}`,
    `Path=/automation/sessions/${sessionId}`,
    `Max-Age=${maxAge}`,
    `Expires=${new Date(expiresAt * 1000).toUTCString()}`,
    'HttpOnly',
    'SameSite=Strict',
    'Priority=High',
  ];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}
