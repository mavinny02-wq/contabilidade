import { BackendClient } from './BackendClient.js';

const client = new BackendClient();

export async function enviarHeartbeat(status: string): Promise<void> {
  await client.heartbeat(status);
}
