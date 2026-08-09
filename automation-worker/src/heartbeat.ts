import { config } from './config.js';

export async function enviarHeartbeat(status: string): Promise<void> {
  const response = await fetch(`${config.backendUrl}/api/interno/workers/heartbeat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Worker-Token': config.token,
    },
    body: JSON.stringify({
      workerId: config.workerId,
      versao: '0.1.0',
      status,
      observadoEm: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Heartbeat rejeitado: HTTP ${response.status}`);
  }
}
