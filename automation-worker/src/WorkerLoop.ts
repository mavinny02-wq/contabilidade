import type { BrowserRuntime } from './BrowserRuntime.js';
import { BackendClient, BackendError } from './BackendClient.js';
import type { FluxoRegistry } from './FluxoRegistry.js';
import {
  InteractiveSessionManager,
  SessionError,
} from './InteractiveSessionManager.js';
import { config } from './config.js';
import type {
  ExecucaoLease,
  IntervencaoRequest,
  ResultadoFluxo,
} from './contracts.js';

export type WorkerLoopState = {
  rodando: boolean;
  execucaoAtual?: string;
  ultimaAquisicaoEm?: string;
  ultimaFalha?: string;
  aguardandoIntervencao?: boolean;
  sessaoInterativaAtual?: string;
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

  private async processar(execucaoInicial: ExecucaoLease): Promise<void> {
    this.state.execucaoAtual = execucaoInicial.id;
    const fluxo = this.registry.obter(
      execucaoInicial.provedorCodigo,
      execucaoInicial.operacao,
    );
    if (!fluxo) {
      await this.client.reportar(execucaoInicial, {
        status: 'FALHA',
        erroCodigo: 'FLUXO_NAO_REGISTRADO',
        erroResumo:
          `Não existe fluxo para ${execucaoInicial.provedorCodigo}/${execucaoInicial.operacao}.`,
        retryable: false,
      });
      this.state.execucaoAtual = undefined;
      return;
    }

    let execucao = execucaoInicial;
    let leaseAtivo = true;
    let renewTimer: NodeJS.Timeout | undefined;
    let sessaoAtual: string | undefined;

    const iniciarRenovacao = () => {
      if (renewTimer || !leaseAtivo) return;
      const renewEvery = Math.max(
        10_000,
        Math.floor(config.leaseSeconds * 1_000 * 0.45),
      );
      renewTimer = setInterval(() => {
        if (!leaseAtivo) return;
        void this.client.renovar(execucao.id, execucao.leaseToken)
          .catch((error) => {
            console.warn(`Não foi possível renovar lease ${execucao.id}`, error);
          });
      }, renewEvery);
    };

    const pararRenovacao = () => {
      if (renewTimer) clearInterval(renewTimer);
      renewTimer = undefined;
    };

    const context = await this.runtime.novoContexto();
    iniciarRenovacao();

    try {
      const page = await context.newPage();
      const parametros = parsePayload(execucao.payloadJson);

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

        pararRenovacao();
        try {
          await this.client.aguardarHumano(
            execucao,
            sessao.sessionId,
            { ...request, timeoutMinutos },
          );
          leaseAtivo = false;
        } catch (error) {
          leaseAtivo = true;
          iniciarRenovacao();
          await this.sessions.dispose(sessao.sessionId, 'BACKEND_REJEITOU_INTERVENCAO');
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
          leaseAtivo = true;
          iniciarRenovacao();
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
          documentos: {
            enviar: (input) => this.client.enviarDocumento(input),
          },
        });
      } catch (error) {
        if (error instanceof SessaoInterativaAbandonadaError) {
          console.warn(
            `Sessão interativa da execução ${execucao.id} foi encerrada sem retomada: ${error.message}`,
          );
          return;
        }
        resultado = {
          status: 'FALHA',
          erroCodigo: 'ERRO_NAO_TRATADO_NO_FLUXO',
          erroResumo: resumoErro(error),
          retryable: true,
        };
      }

      if (leaseAtivo) {
        await this.client.reportar(execucao, resultado);
        if (resultado.status === 'AGUARDANDO_HUMANO') leaseAtivo = false;
      } else {
        console.warn(
          `Resultado da execução ${execucao.id} não foi reportado porque não existe lease ativo.`,
        );
      }
    } finally {
      pararRenovacao();
      if (sessaoAtual) {
        await this.sessions.dispose(sessaoAtual, 'EXECUCAO_ENCERRADA');
      }
      await context.close();
      this.state.execucaoAtual = undefined;
      this.state.aguardandoIntervencao = false;
      this.state.sessaoInterativaAtual = undefined;
    }
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

function resumoErro(error: unknown) {
  return error instanceof Error
    ? `${error.name}: ${error.message}`.slice(0, 500)
    : String(error).slice(0, 500);
}
