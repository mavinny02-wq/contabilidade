import { BackendClient } from './BackendClient.js';
import { BrowserRuntime } from './BrowserRuntime.js';
import { FederalCertificateFlow } from './FederalCertificateFlow.js';
import { PgeSpCertificateFlow } from './PgeSpCertificateFlow.js';
import { SefazSpCertificateFlow } from './SefazSpCertificateFlow.js';
import { SerproCndFlow } from './SerproCndFlow.js';
import { FluxoRegistry } from './FluxoRegistry.js';
import { InteractiveSessionManager } from './InteractiveSessionManager.js';
import { SessionTicketVerifier } from './SessionTicket.js';
import { shutdownConfig } from './ShutdownConfig.js';
import { concluirDentro } from './Shutdown.js';
import { WorkerLoop } from './WorkerLoop.js';
import { config } from './config.js';
import { criarServidor } from './server.js';

const VERSAO = '0.5.1';
const runtime = new BrowserRuntime();
const registry = new FluxoRegistry();
const sessions = new InteractiveSessionManager({
  maxSessions: config.interactiveMaxSessions,
  maxSubscribersPerSession: config.interactiveMaxSubscribersPerSession,
});
const backend = new BackendClient();
const tickets = new SessionTicketVerifier(
  async (payload) => await backend.consumirTicketSessao(payload),
);

registry.registrar(new FederalCertificateFlow());
registry.registrar(new SefazSpCertificateFlow());
registry.registrar(new PgeSpCertificateFlow());
registry.registrar(new SerproCndFlow());

const loop = new WorkerLoop(runtime, registry, sessions, backend);
const servidor = criarServidor(runtime, registry, loop, sessions, tickets);
let loopPromise: Promise<void> = Promise.resolve();
let encerramentoEmCurso = false;

const heartbeat = async () => {
  try {
    await backend.heartbeat(loop.state.rodando ? 'SAUDAVEL' : 'INICIALIZANDO');
  } catch (error) {
    console.warn('Não foi possível enviar heartbeat ao backend', error);
  }
};

servidor.listen(config.port, config.host, () => {
  if (encerramentoEmCurso) return;
  console.log(`Worker de integrações ${VERSAO} disponível em ${config.host}:${config.port}`);
  console.log(`Fluxos registrados: ${registry.codigos().join(', ') || 'nenhum'}`);
  console.log(
    `Limites interativos: ${config.interactiveMaxSessions} sessões e `
      + `${config.interactiveMaxSubscribersPerSession} assinantes SSE por sessão.`,
  );
  if (registry.possuiPortal()) {
    void runtime.iniciar().catch((error) => {
      console.warn('O browser não pôde ser iniciado no startup; fluxos API continuam disponíveis.', error);
    });
  }
  void heartbeat();
  loopPromise = loop.iniciar();
});

const timer = setInterval(() => void heartbeat(), config.heartbeatIntervalMs);

const encerrar = async (signal: string) => {
  if (encerramentoEmCurso) {
    console.warn(`Segundo sinal ${signal} recebido; forçando encerramento do worker.`);
    servidor.closeAllConnections();
    await runtime.fechar().catch(() => undefined);
    process.exit(1);
  }

  encerramentoEmCurso = true;
  clearInterval(timer);
  console.log(
    `Encerramento gracioso solicitado por ${signal}; `
      + `aguardando a execução atual por até ${shutdownConfig.gracePeriodMs} ms.`,
  );

  loop.parar();
  const loopConcluido = await concluirDentro(loopPromise, shutdownConfig.gracePeriodMs);
  if (loopConcluido) {
    console.log('Loop do worker encerrado sem interromper a execução em andamento.');
  } else {
    console.warn(
      'O prazo do encerramento gracioso expirou; conexões e browser serão fechados de forma controlada.',
    );
    servidor.closeAllConnections();
  }

  const servidorFechado = await fecharServidor(shutdownConfig.serverCloseTimeoutMs);
  if (!servidorFechado) {
    console.warn('O servidor HTTP não encerrou no prazo; conexões remanescentes serão finalizadas.');
    servidor.closeAllConnections();
  }

  await runtime.fechar().catch((error) => {
    console.warn('Não foi possível fechar completamente o runtime do navegador.', error);
  });

  process.exit(loopConcluido && servidorFechado ? 0 : 1);
};

process.on('SIGTERM', () => void encerrar('SIGTERM'));
process.on('SIGINT', () => void encerrar('SIGINT'));

async function fecharServidor(timeoutMs: number): Promise<boolean> {
  if (!servidor.listening) return true;
  const fechamento = new Promise<void>((resolve) => {
    servidor.close(() => resolve());
    servidor.closeIdleConnections();
  });
  return await concluirDentro(fechamento, timeoutMs);
}
