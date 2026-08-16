import assert from 'node:assert/strict';
import test from 'node:test';
import { BackendClient } from '../BackendClient.js';
import {
  CORRELATION_HEADER,
  currentCorrelationId,
  runWithCorrelation,
  safeCorrelationId,
} from './CorrelationContext.js';
import { safeLogFields } from './SafeLogger.js';
import { WorkerMetrics } from './WorkerMetrics.js';

test('correlation validates input and isolates concurrent task contexts', async () => {
  assert.equal(safeCorrelationId('worker.trace_1'), 'worker.trace_1');
  assert.match(safeCorrelationId('Bearer secret'), /^[0-9a-f-]{36}$/);

  const observed = await Promise.all([
    runWithCorrelation('task-a', async () => { await new Promise((resolve) => setTimeout(resolve, 5)); return currentCorrelationId(); }),
    runWithCorrelation('task-b', async () => { await Promise.resolve(); return currentCorrelationId(); }),
  ]);
  assert.deepEqual(observed, ['task-a', 'task-b']);
  assert.equal(currentCorrelationId(), undefined);
});

test('BackendClient propagates correlation without exposing response payload', async () => {
  const originalFetch = globalThis.fetch;
  let received: string | null = null;
  globalThis.fetch = async (_input, init) => {
    received = new Headers(init?.headers).get(CORRELATION_HEADER);
    return new Response('external payload CPF 123.456.789-00', { status: 503 });
  };
  try {
    await assert.rejects(
      runWithCorrelation('trace-safe', () => new BackendClient().heartbeat('ATIVO')),
      (error: unknown) => error instanceof Error
        && error.message === 'Backend rejeitou a operação: HTTP 503',
    );
    assert.equal(received, 'trace-safe');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('logger redacts forbidden fields and sensitive values', () => {
  const fields = safeLogFields({
    operation: 'acquire',
    token: 'secret-value',
    detail: 'CPF 123.456.789-00 bearer abc.def',
    payload: { fiscal: true },
  });
  assert.deepEqual(fields, {
    operation: 'acquire',
    token: '[REDACTED]',
    detail: 'CPF [REDACTED] [REDACTED]',
    payload: '[REDACTED]',
  });
});

test('metrics collapse arbitrary labels to bounded other bucket', () => {
  const metrics = new WorkerMetrics();
  for (let index = 0; index < 100; index++) {
    metrics.record(`empresa-${index}`, `resultado-${index}`, `erro-${index}`, 1);
  }
  assert.deepEqual(metrics.snapshot(), [{
    operation: 'other', result: 'other', errorClass: 'other', count: 100, durationMs: 100,
  }]);
});
