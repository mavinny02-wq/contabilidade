import { BrowserRuntime } from './BrowserRuntime.js';
import { FluxoRegistry } from './FluxoRegistry.js';
import { WorkerLoop } from './WorkerLoop.js';
import { config } from './config.js';
import { enviarHeartbeat } from './heartbeat.js';
import { criarServidor } from './server.js';

const runtime = new BrowserRuntime();
const registry = new FluxoRegistry();
const loop = new WorkerLoop(runtime, registry);
const servidor = criarServidor(runtime, registry, loop);

const heartbeat = async () => {
  try {
    await enviarHeartbeat(loop.state.rodando ? 'SAUDAVEL' : 'INICIALIZANDO');
  } catch (error) {
    console.warn('Não foi possível enviar heartbeat ao backend', error);
  }
};

servidor.listen(config.port, '0.0.0.0', () => {
  console.log(`Worker Playwright 0.2.0 disponível na porta ${config.port}`);
  console.log(`Fluxos registrados: ${registry.codigos().join(', ') || 'nenhum'}`);
  void runtime.iniciar();
  void heartbeat();
  void loop.iniciar();
});

const timer = setInterval(() => void heartbeat(), config.heartbeatIntervalMs);

const encerrar = async (signal: string) => {
  console.log(`Encerrando worker: ${signal}`);
  clearInterval(timer);
  loop.parar();
  servidor.close();
  await runtime.fechar();
  process.exit(0);
};

process.on('SIGTERM', () => void encerrar('SIGTERM'));
process.on('SIGINT', () => void encerrar('SIGINT'));
