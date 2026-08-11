import { randomUUID } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import type { BrowserContext, CDPSession, Page } from 'playwright';

type SessionState = 'AGUARDANDO' | 'CONTINUANDO' | 'RETOMADA' | 'ENCERRADA' | 'EXPIRADA';

type Frame = {
  data: string;
  width: number;
  height: number;
  pageScaleFactor: number;
  timestamp: number;
};

type Continuation = {
  operator: string;
};

type SessionRecord = {
  id: string;
  executionId: string;
  page: Page;
  context: BrowserContext;
  cdp: CDPSession;
  createdAt: Date;
  expiresAt: Date;
  state: SessionState;
  frame?: Frame;
  lastFrameBroadcastAt?: number;
  subscribers: Set<ServerResponse>;
  continuation: Deferred<Continuation>;
  resumeAcknowledged: Deferred<void>;
  keepAliveTimer?: NodeJS.Timeout;
  expiryTimer?: NodeJS.Timeout;
  closed: boolean;
};

export type InteractiveSessionLimits = {
  maxSessions: number;
  maxSubscribersPerSession: number;
};

export type InteractiveSessionCapacity = InteractiveSessionLimits & {
  activeSessions: number;
  pendingCreations: number;
  totalSubscribers: number;
};

export type SessionInfo = {
  sessionId: string;
  executionId: string;
  createdAt: string;
  expiresAt: string;
  state: SessionState;
  width: number;
  height: number;
};

export type SessionInput =
  | {
      type: 'pointer';
      action: 'move' | 'down' | 'up' | 'click';
      x: number;
      y: number;
      button?: 'left' | 'middle' | 'right';
      modifiers?: number;
    }
  | {
      type: 'wheel';
      x: number;
      y: number;
      deltaX: number;
      deltaY: number;
      modifiers?: number;
    }
  | {
      type: 'key';
      action: 'down' | 'up';
      key: string;
      code?: string;
      text?: string;
      modifiers?: number;
    }
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'continue';
    };

export class InteractiveSessionManager {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly configuredLimits: InteractiveSessionLimits;
  private pendingCreations = 0;

  constructor(limits: Partial<InteractiveSessionLimits> = {}) {
    this.configuredLimits = {
      maxSessions: boundedInteger(limits.maxSessions, 2, 1, 20),
      maxSubscribersPerSession: boundedInteger(
        limits.maxSubscribersPerSession,
        3,
        1,
        20,
      ),
    };
  }

  async create(input: {
    executionId: string;
    page: Page;
    context: BrowserContext;
    timeoutMinutes: number;
  }): Promise<{ sessionId: string; expiresAt: Date }> {
    if (this.sessions.size + this.pendingCreations >= this.configuredLimits.maxSessions) {
      throw new SessionError('LIMITE_SESSOES_INTERATIVAS_ATINGIDO', 429);
    }

    this.pendingCreations++;
    let record: SessionRecord | undefined;
    try {
      const id = randomUUID();
      const timeoutMinutes = Math.min(Math.max(input.timeoutMinutes, 1), 120);
      const expiresAt = new Date(Date.now() + timeoutMinutes * 60_000);
      const cdp = await input.context.newCDPSession(input.page);
      const continuation = deferred<Continuation>();
      const resumeAcknowledged = deferred<void>();

      record = {
        id,
        executionId: input.executionId,
        page: input.page,
        context: input.context,
        cdp,
        createdAt: new Date(),
        expiresAt,
        state: 'AGUARDANDO' as SessionState,
        subscribers: new Set<ServerResponse>(),
        continuation,
        resumeAcknowledged,
        closed: false,
      };

      record.keepAliveTimer = setInterval(() => {
        this.broadcast(record!, {
          type: 'keepalive',
          timestamp: new Date().toISOString(),
          state: record!.state,
        });
      }, 15_000);

      record.expiryTimer = setTimeout(() => {
        this.expire(record!, 'SESSAO_INTERATIVA_EXPIRADA');
      }, timeoutMinutes * 60_000);

      this.sessions.set(id, record);

      await cdp.send('Page.enable');
      await cdp.send('Input.setIgnoreInputEvents', { ignore: false });
      cdp.on('Page.screencastFrame', (event: unknown) => {
        void this.onFrame(record!, event as ScreencastFrameEvent);
      });
      input.page.once('close', () => {
        if (!record!.closed) this.expire(record!, 'PAGINA_INTERATIVA_FECHADA');
      });
      input.context.once('close', () => {
        if (!record!.closed) this.expire(record!, 'CONTEXTO_INTERATIVO_FECHADO');
      });
      await input.page.bringToFront();
      await cdp.send('Page.startScreencast', {
        format: 'jpeg',
        quality: 72,
        maxWidth: 1440,
        maxHeight: 900,
        everyNthFrame: 2,
      });

      this.broadcast(record, {
        type: 'state',
        state: record.state,
        expiresAt: record.expiresAt.toISOString(),
      });
      return { sessionId: id, expiresAt };
    } catch (error) {
      if (record) {
        await this.dispose(record.id, 'FALHA_INICIALIZACAO_SESSAO');
      }
      throw error;
    } finally {
      this.pendingCreations--;
    }
  }

  info(sessionId: string): SessionInfo {
    const session = this.require(sessionId);
    return {
      sessionId: session.id,
      executionId: session.executionId,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      state: session.state,
      width: session.frame?.width ?? 1440,
      height: session.frame?.height ?? 900,
    };
  }

  connectEvents(sessionId: string, response: ServerResponse): void {
    const session = this.require(sessionId);
    if (session.subscribers.size >= this.configuredLimits.maxSubscribersPerSession) {
      throw new SessionError('LIMITE_ASSINANTES_SESSAO_ATINGIDO', 429);
    }

    response.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    response.write('retry: 1500\n\n');
    session.subscribers.add(response);

    this.writeEvent(response, {
      type: 'state',
      state: session.state,
      expiresAt: session.expiresAt.toISOString(),
    });
    if (session.frame) {
      this.writeEvent(response, { type: 'frame', ...session.frame });
    }

    response.on('close', () => session.subscribers.delete(response));
  }

  async input(sessionId: string, command: SessionInput, operator: string): Promise<void> {
    const session = this.require(sessionId);
    if (session.state !== 'AGUARDANDO') {
      throw new SessionError('SESSAO_NAO_AGUARDA_INTERACAO');
    }
    await session.page.bringToFront();

    switch (command.type) {
      case 'pointer':
        await this.pointer(session, command);
        return;
      case 'wheel':
        await session.cdp.send('Input.dispatchMouseEvent', {
          type: 'mouseWheel',
          x: bounded(command.x, 0, 10000),
          y: bounded(command.y, 0, 10000),
          deltaX: bounded(command.deltaX, -10000, 10000),
          deltaY: bounded(command.deltaY, -10000, 10000),
          modifiers: command.modifiers ?? 0,
        });
        return;
      case 'key':
        await session.cdp.send('Input.dispatchKeyEvent', {
          type: command.action === 'down' ? 'keyDown' : 'keyUp',
          key: command.key.slice(0, 80),
          code: command.code?.slice(0, 80),
          text: command.action === 'down' ? command.text?.slice(0, 200) : undefined,
          unmodifiedText: command.action === 'down' ? command.text?.slice(0, 200) : undefined,
          modifiers: command.modifiers ?? 0,
        });
        return;
      case 'text':
        await session.cdp.send('Input.insertText', {
          text: command.text.slice(0, 500),
        });
        return;
      case 'continue':
        session.state = 'CONTINUANDO';
        this.broadcast(session, { type: 'state', state: session.state });
        session.continuation.resolve({ operator });
        await withTimeout(
          session.resumeAcknowledged.promise,
          25_000,
          'RETOMADA_SESSAO_NAO_CONFIRMADA',
        );
        return;
    }
  }

  waitForContinue(sessionId: string): Promise<Continuation> {
    return this.require(sessionId).continuation.promise;
  }

  acknowledgeResume(sessionId: string): void {
    const session = this.require(sessionId);
    if (session.state !== 'CONTINUANDO') {
      throw new SessionError('SESSAO_NAO_AGUARDA_CONFIRMACAO_DE_RETOMADA');
    }
    session.state = 'RETOMADA';
    this.broadcast(session, { type: 'state', state: session.state });
    session.resumeAcknowledged.resolve();
  }

  rejectResume(sessionId: string, reason: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.closed) return;
    session.resumeAcknowledged.reject(new SessionError(reason));
  }

  async dispose(sessionId: string, reason = 'SESSAO_ENCERRADA'): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.closed) return;
    session.closed = true;
    session.state = 'ENCERRADA';
    session.continuation.reject(new SessionError(reason));
    session.resumeAcknowledged.reject(new SessionError(reason));
    if (session.keepAliveTimer) clearInterval(session.keepAliveTimer);
    if (session.expiryTimer) clearTimeout(session.expiryTimer);
    try {
      await session.cdp.send('Page.stopScreencast');
    } catch {
      // A página pode já ter sido fechada.
    }
    this.broadcast(session, { type: 'closed', reason });
    for (const subscriber of session.subscribers) subscriber.end();
    session.subscribers.clear();
    this.sessions.delete(sessionId);
  }

  activeCount(): number {
    return this.sessions.size;
  }

  limits(): InteractiveSessionCapacity {
    let totalSubscribers = 0;
    for (const session of this.sessions.values()) {
      totalSubscribers += session.subscribers.size;
    }
    return {
      ...this.configuredLimits,
      activeSessions: this.sessions.size,
      pendingCreations: this.pendingCreations,
      totalSubscribers,
    };
  }

  private async pointer(
    session: SessionRecord,
    command: Extract<SessionInput, { type: 'pointer' }>,
  ): Promise<void> {
    const x = bounded(command.x, 0, 10000);
    const y = bounded(command.y, 0, 10000);
    const button = command.button ?? 'left';
    const modifiers = command.modifiers ?? 0;

    if (command.action === 'move') {
      await session.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y,
        button: 'none',
        modifiers,
      });
      return;
    }

    if (command.action === 'click') {
      await session.cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x,
        y,
        button,
        clickCount: 1,
        modifiers,
      });
      await session.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x,
        y,
        button,
        clickCount: 1,
        modifiers,
      });
      return;
    }

    await session.cdp.send('Input.dispatchMouseEvent', {
      type: command.action === 'down' ? 'mousePressed' : 'mouseReleased',
      x,
      y,
      button,
      clickCount: 1,
      modifiers,
    });
  }

  private async onFrame(session: SessionRecord, event: ScreencastFrameEvent): Promise<void> {
    if (session.closed) return;
    const metadata = event.metadata ?? {};
    const frame: Frame = {
      data: event.data,
      width: Math.max(1, Math.round(metadata.deviceWidth ?? 1440)),
      height: Math.max(1, Math.round(metadata.deviceHeight ?? 900)),
      pageScaleFactor: metadata.pageScaleFactor ?? 1,
      timestamp: metadata.timestamp ?? Date.now() / 1000,
    };
    session.frame = frame;
    const now = Date.now();
    if (!session.lastFrameBroadcastAt || now - session.lastFrameBroadcastAt >= 100) {
      session.lastFrameBroadcastAt = now;
      this.broadcast(session, { type: 'frame', ...frame });
    }
    try {
      await session.cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId });
    } catch {
      // Sessão pode estar sendo encerrada.
    }
  }

  private expire(session: SessionRecord, code: string): void {
    if (session.closed) return;
    session.state = 'EXPIRADA';
    this.broadcast(session, { type: 'state', state: session.state, code });
    session.continuation.reject(new SessionError(code));
    void this.dispose(session.id, code);
  }

  private broadcast(session: SessionRecord, payload: unknown): void {
    for (const subscriber of session.subscribers) {
      this.writeEvent(subscriber, payload);
    }
  }

  private writeEvent(response: ServerResponse, payload: unknown): void {
    if (response.destroyed || response.writableEnded) return;
    if (response.writableLength > 2_000_000) {
      // Um cliente lento não deve acumular frames sem limite no worker.
      return;
    }
    response.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  private require(sessionId: string): SessionRecord {
    const session = this.sessions.get(sessionId);
    if (!session || session.closed) throw new SessionError('SESSAO_NAO_ENCONTRADA');
    if (session.expiresAt.getTime() <= Date.now()) {
      this.expire(session, 'SESSAO_INTERATIVA_EXPIRADA');
      throw new SessionError('SESSAO_INTERATIVA_EXPIRADA');
    }
    return session;
  }
}

export class SessionError extends Error {
  constructor(
    readonly code: string,
    readonly status?: number,
  ) {
    super(code);
    this.name = 'SessionError';
  }
}

type ScreencastFrameEvent = {
  data: string;
  metadata?: {
    deviceWidth?: number;
    deviceHeight?: number;
    pageScaleFactor?: number;
    timestamp?: number;
  };
  sessionId: number;
};

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function deferred<T>(): Deferred<T> {
  let settled = false;
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  void promise.catch(() => undefined);
  return {
    promise,
    resolve: (value) => {
      if (settled) return;
      settled = true;
      resolvePromise(value);
    },
    reject: (reason) => {
      if (settled) return;
      settled = true;
      rejectPromise(reason);
    },
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, code: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new SessionError(code)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function bounded(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value!), min), max);
}
