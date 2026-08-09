import { BackendClient } from './BackendClient.js';
import { BrowserRuntime } from './BrowserRuntime.js';
import { FederalCertificateFlow } from './FederalCertificateFlow.js';
import { FluxoRegistry } from './FluxoRegistry.js';
import { InteractiveSessionManager } from './InteractiveSessionManager.js';
import { SessionTicketVerifier } from './SessionTicket.js';
import { WorkerLoop } from './WorkerLoop.js';
import { config } from './config.js';
import { criarServidor } from './server.js';

const runtime = new BrowserRuntime();
const registry = new FluxoRegistry();
const sessions = new InteractiveSessionManager();
const tickets = new SessionTicketVerifier();
const backend = new BackendClient();

registry.registrar(new FederalCertificateFlow());

const loop = new WorkerLoop(runtime, registry, sessions, backend);
const servidor = criarServidor(runtime, registry, loop, sessions, tickets);

const heartbeat = async () => {
  try {
    await backend.heartbeat(loop.state.rodando ? 'SAUDAVEL' : 'INICIALIZANDO');
  } catch (error) {
    console.warn('Não foi possível enviar heartbeat ao backend', error);
  }
};

servidor.listen(config.port, '0.0.0.0', () => {
  console.log(`Worker Playwright 0.3.0 disponível na porta ${config.port}`);
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
