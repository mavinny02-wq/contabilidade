import type { BrowserContext } from 'playwright';
import type { BrowserRuntime } from './BrowserRuntime.js';
import { BackendClient, BackendError } from './BackendClient.js';
import type { FluxoRegistry } from './FluxoRegistry.js';
import {
  InteractiveSessionManager,
  SessionError,
} from './InteractiveSessionManager.js';
import { config } from './config.js';
import type {
  DocumentoRuntime,
  ExecucaoLease,
  FluxoApi,
  FluxoPortal,
  IntervencaoRequest,
  ResultadoFluxo,
} from './contracts.js';

export type WorkerLoopState = {
  rodando: boolean;
  execucaoAtual?: string;
  modoExecucaoAtual?: 'API' | 'PORTAL';
  ultimaAquisicaoEm?: string;
  ultimaFalha?: string;
  aguardandoIntervencao?: boolean;
  sessaoInterativaAtual?: string;
};

type LeaseControl = {
  ativo: () => boolean;
  iniciar: () => void;
  parar: () => void;
  desativar: () => void;
};

export class WorkerLoop {
  readonly state: WorkerLoopState = { rodando: false };
  private stopping = false;

  constructor(
    private readonly runtime: BrowserRuntime,
    private readonly registry: FluxoRegistry,
    private readonly sessions: InteractiveSessionManager,
    private readonly client: BackendClient,
  ) {}

  async iniciar(): Promise<void> {
    if (this.state.rodando) return;
    this.stopping = false;
    this.state.rodando = true;

    while (!this.stopping) {
      try {
        const execucao = await this.client.adquirir(
          this.registry.operacoes(),
          this.registry.provedores(),
        );
        this.state.ultimaAquisicaoEm = new Date().toISOString();
        if (!execucao) {
          await esperar(config.pollIntervalMs);
          continue;
        }
        await this.processar(execucao);
      } catch (error) {
        this.state.ultimaFalha = resumoErro(error);
        console.warn('Falha no ciclo de aquisição do worker', error);
        await esperar(config.pollIntervalMs);
      }
    }

    this.state.rodando = false;
  }

  parar(): void {
    this.stopping = true;
  }

  private async processar(execucao: ExecucaoLease): Promise<void> {
    this.state.execucaoAtual = execucao.id;
    const fluxo = this.registry.obter(execucao.provedorCodigo, execucao.operacao);

    try {
      if (!fluxo) {
        await this.client.reportar(execucao, {
          status: 'FALHA',
          erroCodigo: 'FLUXO_NAO_REGISTRADO',
          erroResumo:
            `Não existe fluxo para ${execucao.provedorCodigo}/${execucao.operacao}.`,
          retryable: false,
        });
        return;
      }

      this.state.modoExecucaoAtual = fluxo.modo;
      const parametros = parsePayload(execucao.payloadJson);
      if (fluxo.modo === 'API') {
        await this.processarApi(execucao, fluxo, parametros);
      } else {
        await this.processarPortal(execucao, fluxo, parametros);
      }
    } finally {
      this.limparEstadoExecucao();
    }
  }

  private async processarApi(
    execucao: ExecucaoLease,
    fluxo: FluxoApi,
    parametros: Record<string, unknown>,
  ): Promise<void> {
    const lease = this.criarControleLease(() => execucao);
    lease.iniciar();

    try {
      let resultado: ResultadoFluxo;
      try {
        resultado = await fluxo.executar({
          execucaoId: execucao.id,
          empresaId: execucao.empresaId,
          provedorCodigo: execucao.provedorCodigo,
          operacao: execucao.operacao,
          parametros,
          documentos: this.documentosRuntime(),
        });
      } catch (error) {
        resultado = erroNaoTratado(error);
      }

      if (!lease.ativo()) {
        console.warn(
          `Resultado da execução API ${execucao.id} não foi reportado porque o lease não está ativo.`,
        );
        return;
      }

      await this.client.reportar(execucao, resultado);
      if (resultado.status === 'AGUARDANDO_HUMANO') {
        lease.desativar();
      }
    } finally {
      lease.parar();
    }
  }

  private async processarPortal(
    execucaoInicial: ExecucaoLease,
    fluxo: FluxoPortal,
    parametros: Record<string, unknown>,
  ): Promise<void> {
    let execucao = execucaoInicial;
    let sessaoAtual: string | undefined;
    const lease = this.criarControleLease(() => execucao);
    const context = await this.runtime.novoContexto();
    lease.iniciar();

    try {
      const page = await context.newPage();

      const aguardarIntervencao = async (request: IntervencaoRequest) => {
        if (sessaoAtual) {
          throw new Error('Já existe uma sessão interativa aberta para esta execução.');
        }

        const timeoutMinutos = request.timeoutMinutos ?? numeroParametro(
          parametros.timeoutHumanoMinutos,
          30,
          1,
          120,
        );
        const sessao = await this.sessions.create({
          executionId: execucao.id,
          page,
          context,
          timeoutMinutes: timeoutMinutos,
        });
        sessaoAtual = sessao.sessionId;
        this.state.aguardandoIntervencao = true;
        this.state.sessaoInterativaAtual = sessao.sessionId;

        lease.parar();
        try {
          await this.client.aguardarHumano(
            execucao,
            sessao.sessionId,
            { ...request, timeoutMinutos },
          );
          lease.desativar();
        } catch (error) {
          lease.iniciar();
          await this.sessions.dispose(
            sessao.sessionId,
            'BACKEND_REJEITOU_INTERVENCAO',
          );
          sessaoAtual = undefined;
          this.state.aguardandoIntervencao = false;
          this.state.sessaoInterativaAtual = undefined;
          throw error;
        }

        try {
          const continuation = await this.sessions.waitForContinue(sessao.sessionId);
          execucao = await this.client.retomarSessao({
            execucaoId: execucao.id,
            sessionId: sessao.sessionId,
            operador: continuation.operator,
          });
          this.sessions.acknowledgeResume(sessao.sessionId);
          lease.iniciar();
          return {
            sessionId: sessao.sessionId,
            operator: continuation.operator,
          };
        } catch (error) {
          this.sessions.rejectResume(sessao.sessionId, 'RETOMADA_SESSAO_REJEITADA');
          if (
            error instanceof SessionError
            || (error instanceof BackendError && [409, 410].includes(error.status))
          ) {
            throw new SessaoInterativaAbandonadaError(resumoErro(error));
          }
          throw error;
        } finally {
          await this.sessions.dispose(sessao.sessionId, 'INTERVENCAO_FINALIZADA');
          sessaoAtual = undefined;
          this.state.aguardandoIntervencao = false;
          this.state.sessaoInterativaAtual = undefined;
        }
      };

      let resultado: ResultadoFluxo;
      try {
        resultado = await fluxo.executar({
          execucaoId: execucao.id,
          empresaId: execucao.empresaId,
          provedorCodigo: execucao.provedorCodigo,
          operacao: execucao.operacao,
          parametros,
          browserContext: context,
          page,
          intervencao: { aguardar: aguardarIntervencao },
          documentos: this.documentosRuntime(),
        });
      } catch (error) {
        if (error instanceof SessaoInterativaAbandonadaError) {
          console.warn(
            `Sessão interativa da execução ${execucao.id} foi encerrada sem retomada: ${error.message}`,
          );
          return;
        }
        resultado = erroNaoTratado(error);
      }

      if (lease.ativo()) {
        await this.client.reportar(execucao, resultado);
        if (resultado.status === 'AGUARDANDO_HUMANO') {
          lease.desativar();
        }
      } else {
        console.warn(
          `Resultado da execução ${execucao.id} não foi reportado porque não existe lease ativo.`,
        );
      }
    } finally {
      lease.parar();
      if (sessaoAtual) {
        await this.sessions.dispose(sessaoAtual, 'EXECUCAO_ENCERRADA');
      }
      await fecharContextoSeguro(context);
      this.state.aguardandoIntervencao = false;
      this.state.sessaoInterativaAtual = undefined;
    }
  }

  private documentosRuntime(): DocumentoRuntime {
    return {
      enviar: (input) => this.client.enviarDocumento(input),
      enviarBytes: (input) => this.client.enviarDocumentoBytes(input),
    };
  }

  private criarControleLease(getExecucao: () => ExecucaoLease): LeaseControl {
    let ativo = true;
    let timer: NodeJS.Timeout | undefined;

    const iniciar = () => {
      ativo = true;
      if (timer) return;
      const renewEvery = Math.max(
        10_000,
        Math.floor(config.leaseSeconds * 1_000 * 0.45),
      );
      timer = setInterval(() => {
        if (!ativo) return;
        const execucao = getExecucao();
        void this.client.renovar(execucao.id, execucao.leaseToken)
          .catch((error) => {
            console.warn(`Não foi possível renovar lease ${execucao.id}`, error);
            if (error instanceof BackendError && [409, 410].includes(error.status)) {
              ativo = false;
            }
          });
      }, renewEvery);
    };

    const parar = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };

    const desativar = () => {
      ativo = false;
      parar();
    };

    return {
      ativo: () => ativo,
      iniciar,
      parar,
      desativar,
    };
  }

  private limparEstadoExecucao(): void {
    this.state.execucaoAtual = undefined;
    this.state.modoExecucaoAtual = undefined;
    this.state.aguardandoIntervencao = false;
    this.state.sessaoInterativaAtual = undefined;
  }
}

class SessaoInterativaAbandonadaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessaoInterativaAbandonadaError';
  }
}

const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function parsePayload(payload?: string): Record<string, unknown> {
  if (!payload) return {};
  try {
    const parsed = JSON.parse(payload) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function numeroParametro(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

function erroNaoTratado(error: unknown): ResultadoFluxo {
  return {
    status: 'FALHA',
    erroCodigo: 'ERRO_NAO_TRATADO_NO_FLUXO',
    erroResumo: resumoErro(error),
    retryable: true,
  };
}

async function fecharContextoSeguro(context: BrowserContext): Promise<void> {
  try {
    await context.close();
  } catch (error) {
    console.warn('Não foi possível fechar o contexto do navegador', error);
  }
}

function resumoErro(error: unknown): string {
  return error instanceof Error
    ? `${error.name}: ${error.message}`.slice(0, 500)
    : String(error).slice(0, 500);
}
