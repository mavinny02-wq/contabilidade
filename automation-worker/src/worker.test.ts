import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { BrowserContext, CDPSession, Page } from 'playwright';
import { BrowserRuntime } from './BrowserRuntime.js';
import { FluxoRegistry } from './FluxoRegistry.js';
import { InteractiveSessionManager, SessionError } from './InteractiveSessionManager.js';
import { extractTextFromPdf } from './PdfTextExtractor.js';
import { SessionTicketVerifier, TicketError, type SessionTicketPayload } from './SessionTicket.js';
import { WorkerLoop } from './WorkerLoop.js';
import { config, integerValue, requiredSecret } from './config.js';

const ids = { sid: '11111111-1111-4111-8111-111111111111', iid: '22222222-2222-4222-8222-222222222222', eid: '33333333-3333-4333-8333-333333333333', jti: '44444444-4444-4444-8444-444444444444' };

test('configuração limita inteiros e rejeita segredo curto', () => {
  assert.equal(integerValue('999', 10, 1, 20), 20);
  assert.equal(integerValue('inválido', 10, 1, 20), 10);
  assert.throws(() => requiredSecret('curto', 'também-curto'), /32 caracteres/);
  assert.equal(requiredSecret('x'.repeat(32), 'fallback'), 'x'.repeat(32));
});

function ticket(payload: SessionTicketPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', config.sessionSigningSecret).update(encoded, 'ascii').digest('base64url');
  return `${encoded}.${signature}`;
}

test('ticket valida assinatura, expiração, claims e grant sem expor segredo', async () => {
  const now = Math.floor(Date.now() / 1000);
  const payload = { ...ids, sub: 'operador-ficticio', exp: now + 120 };
  let consumptions = 0;
  const verifier = new SessionTicketVerifier(async () => { consumptions++; return 'CONSUMED'; });
  const auth = await verifier.authenticate({ ticket: ticket(payload), expectedSessionId: ids.sid, cookieHeader: undefined, secureCookie: true });
  assert.equal(consumptions, 1);
  assert.match(auth.setCookie ?? '', /HttpOnly; SameSite=Strict; Priority=High; Secure/);
  assert.ok(!auth.setCookie?.includes(config.sessionSigningSecret));
  const grant = await verifier.authenticate({ ticket: undefined, expectedSessionId: ids.sid, cookieHeader: auth.setCookie?.split(';', 1)[0], secureCookie: true });
  assert.equal(grant.payload.sub, payload.sub);
  await assert.rejects(verifier.authenticate({ ticket: `${ticket(payload)}x`, expectedSessionId: ids.sid, cookieHeader: undefined, secureCookie: false }), (error: unknown) => error instanceof TicketError && error.code === 'TICKET_ASSINATURA_INVALIDA');
  await assert.rejects(verifier.authenticate({ ticket: ticket({ ...payload, exp: now - 1 }), expectedSessionId: ids.sid, cookieHeader: undefined, secureCookie: false }), (error: unknown) => error instanceof TicketError && error.code === 'TICKET_EXPIRADO');
  await assert.rejects(verifier.authenticate({ ticket: ticket({ ...payload, sid: 'não-é-uuid' }), expectedSessionId: ids.sid, cookieHeader: undefined, secureCookie: false }), (error: unknown) => error instanceof TicketError && error.code === 'TICKET_PAYLOAD_INVALIDO');
});

function browserDoubles(failStart = false) {
  const cdp = new EventEmitter() as EventEmitter & { send: (method: string) => Promise<void> };
  cdp.send = async (method) => { if (failStart && method === 'Page.startScreencast') throw new Error('falha sintética'); };
  const page = new EventEmitter() as EventEmitter & { bringToFront: () => Promise<void> };
  page.bringToFront = async () => undefined;
  const context = new EventEmitter() as EventEmitter & { newCDPSession: () => Promise<typeof cdp> };
  context.newCDPSession = async () => cdp;
  return { cdp: cdp as unknown as CDPSession, page: page as unknown as Page, context: context as unknown as BrowserContext };
}

class ResponseDouble extends EventEmitter {
  writeHead(): this { return this; }
  write(): boolean { return true; }
  end(): this { this.emit('close'); return this; }
}

test('sessões limitam criações e assinantes e limpam criação parcial', async () => {
  const manager = new InteractiveSessionManager({ maxSessions: 1, maxSubscribersPerSession: 1 });
  const created = await manager.create({ executionId: ids.eid, ...browserDoubles(), timeoutMinutes: 1 });
  await assert.rejects(manager.create({ executionId: ids.eid, ...browserDoubles(), timeoutMinutes: 1 }), (error: unknown) => error instanceof SessionError && error.status === 429);
  manager.connectEvents(created.sessionId, new ResponseDouble() as never);
  assert.throws(() => manager.connectEvents(created.sessionId, new ResponseDouble() as never), (error: unknown) => error instanceof SessionError && error.status === 429);
  await manager.dispose(created.sessionId);
  assert.equal(manager.activeCount(), 0);
  const failed = new InteractiveSessionManager({ maxSessions: 1 });
  await assert.rejects(failed.create({ executionId: ids.eid, ...browserDoubles(true), timeoutMinutes: 1 }));
  assert.deepEqual(failed.limits(), { maxSessions: 1, maxSubscribersPerSession: 3, activeSessions: 0, pendingCreations: 0, totalSubscribers: 0 });
});

function syntheticPdf(text: string): Buffer {
  const stream = `BT /F1 18 Tf 40 100 Td (${text.replace(/[()\\]/g, '\\$&')}) Tj ET`;
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 200] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>', `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

test('PDF.js importa sem globais de canvas e extrai PDF sintético temporário', async () => {
  Reflect.deleteProperty(globalThis, 'DOMMatrix'); Reflect.deleteProperty(globalThis, 'Path2D'); Reflect.deleteProperty(globalThis, 'ImageData');
  const directory = await mkdtemp(join(tmpdir(), 'contabilidade-pdf-'));
  try {
    const path = join(directory, 'ficticio.pdf');
    await writeFile(path, syntheticPdf('DOCUMENTO FICTICIO CODEX CLOUD'));
    assert.equal(await extractTextFromPdf(path), 'DOCUMENTO FICTICIO CODEX CLOUD');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('registro vazio carrega com provedores reais desabilitados', () => {
  const registry = new FluxoRegistry();
  assert.deepEqual(registry.codigos(), []); assert.deepEqual(registry.diagnosticos(), []); assert.equal(registry.possuiPortal(), false);
});

test('shutdown acorda loop ocioso e preserva trabalho em andamento', async () => {
  const runtime = {} as BrowserRuntime;
  const sessions = {} as InteractiveSessionManager;
  const registry = new FluxoRegistry();
  const idleClient = { adquirir: async () => undefined };
  const idle = new WorkerLoop(runtime, registry, sessions, idleClient as never);
  const idlePromise = idle.iniciar();
  await new Promise((resolve) => setTimeout(resolve, 20));
  idle.parar();
  await Promise.race([idlePromise, new Promise((_, reject) => setTimeout(() => reject(new Error('loop ocioso não encerrou')), 500))]);
  assert.equal(idle.state.rodando, false);

  let release!: () => void;
  const acquisition = new Promise<undefined>((resolve) => { release = () => resolve(undefined); });
  const busy = new WorkerLoop(runtime, registry, sessions, { adquirir: async () => acquisition } as never);
  const busyPromise = busy.iniciar();
  await new Promise((resolve) => setTimeout(resolve, 20));
  busy.parar();
  let finished = false;
  void busyPromise.then(() => { finished = true; });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(finished, false);
  release();
  await busyPromise;
  assert.equal(busy.state.rodando, false);
});

test('smoke Playwright permite somente páginas locais e fecha recursos', { timeout: 30_000 }, async () => {
  const runtime = new BrowserRuntime();
  try {
    const context = await runtime.novoContextoLocalSeguro();
    const page = await context.newPage();
    await page.goto(`data:text/html;charset=utf-8,${encodeURIComponent('<title>Smoke local fictício</title>')}`);
    assert.equal(await page.title(), 'Smoke local fictício');
    const response = await page.goto('https://example.invalid/nao-acessar').catch((error: unknown) => error);
    assert.ok(response instanceof Error);
    await page.close(); await context.close();
  } finally { await runtime.fechar(); }
});
