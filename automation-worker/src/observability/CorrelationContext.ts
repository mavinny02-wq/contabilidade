import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export const CORRELATION_HEADER = 'X-Correlation-Id';
const SAFE_CORRELATION_ID = /^[A-Za-z0-9._-]{1,100}$/;
const storage = new AsyncLocalStorage<Readonly<{ correlationId: string }>>();

export function safeCorrelationId(candidate?: string | null): string {
  return candidate && SAFE_CORRELATION_ID.test(candidate) ? candidate : randomUUID();
}

export function currentCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}

export function runWithCorrelation<T>(correlationId: string | undefined, task: () => T): T {
  return storage.run({ correlationId: safeCorrelationId(correlationId) }, task);
}
