import { currentCorrelationId } from './CorrelationContext.js';

const FORBIDDEN_KEY = /(?:authorization|token|secret|cookie|cert|cnpj|cpf|document|payload|name|url)/i;
const SENSITIVE_VALUE = /(?:bearer\s+\S+|\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{2}\.?\d{3}\.?\d{3}[/.-]?\d{4}-?\d{2}\b|https?:\/\/\S*[?&](?:token|key|auth)=\S+)/gi;

export function safeLogFields(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [
    key,
    FORBIDDEN_KEY.test(key) ? '[REDACTED]' : safeValue(value),
  ]));
}

export function structuredLog(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: Record<string, unknown> = {},
): void {
  console[level](JSON.stringify({
    level,
    event: event.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 64),
    correlationId: currentCorrelationId() ?? null,
    ...safeLogFields(fields),
  }));
}

function safeValue(value: unknown): unknown {
  if (typeof value === 'string') return value.replace(SENSITIVE_VALUE, '[REDACTED]').slice(0, 256);
  if (typeof value === 'number' || typeof value === 'boolean' || value == null) return value;
  return '[REDACTED]';
}
