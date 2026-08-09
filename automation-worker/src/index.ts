import { BrowserRuntime } from './BrowserRuntime.js';
import { FluxoRegistry } from './FluxoRegistry.js';
import { config } from './config.js';
import { enviarHeartbeat } from './heartbeat.js';
import { criarServidor } from './server.js';

const runtime = new BrowserRuntime();
const registry = new FluxoRegistry();

const servidor = criarServidor(runtime, registry);

const heartbeat = async () => {
  try {
    await enviarHeartbeat('SAUDAVEL');
  } catch (error) {
    console.warn('Não foi possível enviar heartbeat ao backend', error);
  }
};

servidor.listen(config.port, '0.0.0.0', () => {
  console.log(`Worker Playwright disponível na porta ${config.port}`);
  console.log('Nenhum fluxo real de portal está registrado nesta baseline.');
  void heartbeat();
});

const timer = setInterval(() => void heartbeat(), config.heartbeatIntervalMs);

const encerrar = async (signal: string) => {
  console.log(`Encerrando worker: ${signal}`);
  clearInterval(timer);
  servidor.close();
  await runtime.fechar();
  process.exit(0);
};

process.on('SIGTERM', () => void encerrar('SIGTERM'));
process.on('SIGINT', () => void encerrar('SIGINT'));
