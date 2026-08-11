import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import type { BrowserRuntime } from './BrowserRuntime.js';
import type { FluxoRegistry } from './FluxoRegistry.js';
import {
  InteractiveSessionManager,
  SessionError,
  type SessionInput,
} from './InteractiveSessionManager.js';
import { SessionTicketVerifier, TicketError } from './SessionTicket.js';
import type { WorkerLoop } from './WorkerLoop.js';
import { config } from './config.js';

const json = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
};

export function criarServidor(
  runtime: BrowserRuntime,
  registry: FluxoRegistry,
  loop: WorkerLoop,
  sessions: InteractiveSessionManager,
  tickets: SessionTicketVerifier,
) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

      if (request.method === 'GET' && ['/health', '/automation/health'].includes(url.pathname)) {
        const diagnosticos = registry.diagnosticos();
        const browserNecessario = registry.possuiPortal();
        const browserSaudavel = browserNecessario ? await runtime.saudavel() : true;
        const apiConfigurada = diagnosticos.some(
          (item) => item.modo === 'API' && item.configurado,
        );
        const operacional = browserSaudavel || apiConfigurada;
        const status = browserSaudavel
          ? 'SAUDAVEL'
          : apiConfigurada
            ? 'DEGRADADO'
            : 'INDISPONIVEL';
        json(response, operacional ? 200 : 503, {
          status,
          workerId: config.workerId,
          versao: '0.5.1',
          browser: {
            necessario: browserNecessario,
            status: browserSaudavel ? 'SAUDAVEL' : 'INDISPONIVEL',
          },
          fluxosRegistrados: registry.codigos(),
          capacidades: registry.capacidades(),
          diagnosticos,
          sessoesInterativasAtivas: sessions.activeCount(),
          loop: loop.state,
        });
        return;
      }

      if (request.method === 'GET' && ['/flows', '/automation/flows'].includes(url.pathname)) {
        json(response, 200, {
          versao: '0.5.1',
          fluxos: registry.codigos(),
          capacidades: registry.capacidades(),
          diagnosticos: registry.diagnosticos(),
        });
        return;
      }

      const sessionRoute = parseSessionRoute(url.pathname);
      if (sessionRoute) {
        const ticketQuery = url.searchParams.get('ticket') ?? undefined;
        if (ticketQuery && !(request.method === 'GET' && sessionRoute.action === 'info')) {
          throw new TicketError('TICKET_TROCA_ROTA_INVALIDA', 400);
        }

        const authentication = await tickets.authenticate({
          ticket: ticketQuery,
          expectedSessionId: sessionRoute.sessionId,
          cookieHeader: request.headers.cookie,
          secureCookie: isSecureRequest(request),
        });

        const ticketPayload = authentication.payload;
        const sessionInfo = sessions.info(sessionRoute.sessionId);
        if (sessionInfo.executionId !== ticketPayload.eid) {
          throw new TicketError('TICKET_EXECUCAO_DIVERGENTE');
        }
        if (authentication.setCookie) {
          response.setHeader('Set-Cookie', authentication.setCookie);
        }

        if (request.method === 'GET' && sessionRoute.action === 'info') {
          json(response, 200, sessionInfo);
          return;
        }

        if (request.method === 'GET' && sessionRoute.action === 'events') {
          sessions.connectEvents(sessionRoute.sessionId, response);
          return;
        }

        if (request.method === 'POST' && sessionRoute.action === 'input') {
          const body = await readJsonBody(request, 32_768);
          await sessions.input(
            sessionRoute.sessionId,
            validateInput(body),
            ticketPayload.sub,
          );
          json(response, 202, { aceito: true });
          return;
        }
      }

      json(response, 404, { codigo: 'ROTA_NAO_ENCONTRADA' });
    } catch (error) {
      if (error instanceof TicketError) {
        json(response, error.status, { codigo: error.code });
        return;
      }
      if (error instanceof SessionError) {
        const status = error.code.includes('EXPIRADA') ? 410 : 409;
        json(response, status, { codigo: error.code });
        return;
      }
      if (error instanceof RequestError) {
        json(response, error.status, { codigo: error.code });
        return;
      }
      console.error('Falha no endpoint do worker', error);
      json(response, 500, { codigo: 'ERRO_INTERNO_WORKER' });
    }
  });
}

function parseSessionRoute(pathname: string): {
  sessionId: string;
  action: 'events' | 'input' | 'info';
} | undefined {
  const match = pathname.match(
    /^\/automation\/sessions\/([0-9a-fA-F-]{36})\/(events|input|info)$/,
  );
  if (!match?.[1] || !match[2]) return undefined;
  return {
    sessionId: match[1].toLowerCase(),
    action: match[2] as 'events' | 'input' | 'info',
  };
}

function isSecureRequest(request: IncomingMessage): boolean {
  const forwarded = request.headers['x-forwarded-proto'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(',')[0]?.trim().toLowerCase() === 'https';
}

async function readJsonBody(
  request: IncomingMessage,
  maxBytes: number,
): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      throw new RequestError(413, 'PAYLOAD_INTERATIVO_MUITO_GRANDE');
    }
    chunks.push(buffer);
  }
  if (chunks.length === 0) throw new RequestError(400, 'PAYLOAD_INTERATIVO_AUSENTE');
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new RequestError(400, 'PAYLOAD_INTERATIVO_INVALIDO');
  }
}

function validateInput(value: unknown): SessionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RequestError(400, 'COMANDO_INTERATIVO_INVALIDO');
  }
  const input = value as Record<string, unknown>;
  const type = String(input.type ?? '');

  if (type === 'continue') return { type: 'continue' };
  if (type === 'text') {
    const text = String(input.text ?? '');
    if (!text || text.length > 500) {
      throw new RequestError(400, 'TEXTO_INTERATIVO_INVALIDO');
    }
    return { type: 'text', text };
  }
  if (type === 'pointer') {
    const action = String(input.action ?? '');
    if (!['move', 'down', 'up', 'click'].includes(action)) {
      throw new RequestError(400, 'ACAO_POINTER_INVALIDA');
    }
    return {
      type: 'pointer',
      action: action as 'move' | 'down' | 'up' | 'click',
      x: finiteNumber(input.x, 'COORDENADA_X_INVALIDA'),
      y: finiteNumber(input.y, 'COORDENADA_Y_INVALIDA'),
      button: optionalButton(input.button),
      modifiers: optionalInteger(input.modifiers),
    };
  }
  if (type === 'wheel') {
    return {
      type: 'wheel',
      x: finiteNumber(input.x, 'COORDENADA_X_INVALIDA'),
      y: finiteNumber(input.y, 'COORDENADA_Y_INVALIDA'),
      deltaX: finiteNumber(input.deltaX, 'DELTA_X_INVALIDO'),
      deltaY: finiteNumber(input.deltaY, 'DELTA_Y_INVALIDO'),
      modifiers: optionalInteger(input.modifiers),
    };
  }
  if (type === 'key') {
    const action = String(input.action ?? '');
    const key = String(input.key ?? '');
    if (!['down', 'up'].includes(action) || !key || key.length > 80) {
      throw new RequestError(400, 'TECLA_INTERATIVA_INVALIDA');
    }
    return {
      type: 'key',
      action: action as 'down' | 'up',
      key,
      code: optionalString(input.code, 80),
      text: optionalString(input.text, 200),
      modifiers: optionalInteger(input.modifiers),
    };
  }
  throw new RequestError(400, 'TIPO_COMANDO_INTERATIVO_INVALIDO');
}

function finiteNumber(value: unknown, code: string): number {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new RequestError(400, code);
  return number;
}

function optionalInteger(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 255) {
    throw new RequestError(400, 'MODIFICADORES_INVALIDOS');
  }
  return number;
}

function optionalButton(value: unknown): 'left' | 'middle' | 'right' | undefined {
  if (value === undefined || value === null) return undefined;
  const button = String(value);
  if (!['left', 'middle', 'right'].includes(button)) {
    throw new RequestError(400, 'BOTAO_POINTER_INVALIDO');
  }
  return button as 'left' | 'middle' | 'right';
}

function optionalString(value: unknown, maxLength: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value);
  if (text.length > maxLength) throw new RequestError(400, 'TEXTO_INTERATIVO_INVALIDO');
  return text;
}

class RequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
    this.name = 'RequestError';
  }
}
