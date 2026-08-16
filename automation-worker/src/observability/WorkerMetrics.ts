const OPERATIONS = new Set(['acquire', 'heartbeat', 'renew', 'report', 'document', 'session']);
const RESULTS = new Set(['success', 'client_error', 'server_error', 'timeout']);
const ERROR_CLASSES = new Set(['none', 'http_4xx', 'http_5xx', 'network', 'timeout', 'unexpected']);

export type WorkerMetric = Readonly<{
  operation: string;
  result: string;
  errorClass: string;
  count: number;
  durationMs: number;
}>;

export class WorkerMetrics {
  private readonly values = new Map<string, { count: number; durationMs: number }>();

  record(operation: string, result: string, errorClass: string, durationMs: number): void {
    const labels = [bounded(operation, OPERATIONS), bounded(result, RESULTS), bounded(errorClass, ERROR_CLASSES)];
    const key = labels.join('|');
    const current = this.values.get(key) ?? { count: 0, durationMs: 0 };
    current.count++;
    current.durationMs += Math.max(0, durationMs);
    this.values.set(key, current);
  }

  snapshot(): WorkerMetric[] {
    return [...this.values].map(([key, value]) => {
      const [operation = 'other', result = 'other', errorClass = 'other'] = key.split('|');
      return { operation, result, errorClass, ...value };
    });
  }
}

function bounded(value: string, allowed: Set<string>): string {
  return allowed.has(value) ? value : 'other';
}

export const workerMetrics = new WorkerMetrics();
