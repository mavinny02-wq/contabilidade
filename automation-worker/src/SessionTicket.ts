import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';

export type SessionTicketPayload = {
  sid: string;
  iid: string;
  eid: string;
  sub: string;
  exp: number;
  jti: string;
};

export class SessionTicketVerifier {
  verify(ticket: string | undefined, expectedSessionId: string): SessionTicketPayload {
    if (!ticket) throw new TicketError('TICKET_AUSENTE');

    const parts = ticket.split('.');
    if (parts.length !== 2) throw new TicketError('TICKET_INVALIDO');

    const [payloadEncoded, signatureEncoded] = parts;
    if (!payloadEncoded || !signatureEncoded) throw new TicketError('TICKET_INVALIDO');

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
      !payload.sid ||
      !payload.iid ||
      !payload.eid ||
      !payload.sub ||
      !payload.exp ||
      payload.sid !== expectedSessionId
    ) {
      throw new TicketError('TICKET_PAYLOAD_INVALIDO');
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new TicketError('TICKET_EXPIRADO');
    }
    return payload;
  }
}

export class TicketError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'TicketError';
  }
}

function decodeBase64Url(value: string): Buffer {
  try {
    return Buffer.from(value, 'base64url');
  } catch {
    throw new TicketError('TICKET_INVALIDO');
  }
}
