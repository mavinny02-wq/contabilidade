import type { BrowserRuntime } from './BrowserRuntime.js';
import { BackendClient } from './BackendClient.js';
import type { FluxoRegistry } from './FluxoRegistry.js';
import { config } from './config.js';
import type { ExecucaoLease, ResultadoFluxo } from './contracts.js';

export type WorkerLoopState = {
  rodando: boolean;
  execucaoAtual?: string;
  ultimaAquisicaoEm?: string;
  ultimaFalha?: string;
};

export class WorkerLoop {
  readonly state: WorkerLoopState = { rodando: false };
  private readonly client = new BackendClient();
  private stopping = false;

  constructor(
    private readonly runtime: BrowserRuntime,
    private readonly registry: FluxoRegistry,
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
    if (!fluxo) {
      await this.client.reportar(execucao, {
        status: 'FALHA',
        erroCodigo: 'FLUXO_NAO_REGISTRADO',
        erroResumo: `Não existe fluxo para ${execucao.provedorCodigo}/${execucao.operacao}.`,
        retryable: false,
      });
      this.state.execucaoAtual = undefined;
      return;
    }

    const context = await this.runtime.novoContexto();
    const renewEvery = Math.max(10_000, Math.floor(config.leaseSeconds * 1_000 * 0.45));
    const renewTimer = setInterval(() => {
      void this.client.renovar(execucao.id, execucao.leaseToken)
        .catch((error) => console.warn(`Não foi possível renovar lease ${execucao.id}`, error));
    }, renewEvery);

    try {
      const page = await context.newPage();
      const parametros = parsePayload(execucao.payloadJson);
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
        });
      } catch (error) {
        resultado = {
          status: 'FALHA',
          erroCodigo: 'ERRO_NAO_TRATADO_NO_FLUXO',
          erroResumo: resumoErro(error),
          retryable: true,
        };
      }
      await this.client.reportar(execucao, resultado);
    } finally {
      clearInterval(renewTimer);
      await context.close();
      this.state.execucaoAtual = undefined;
    }
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

function resumoErro(error: unknown) {
  return error instanceof Error ? `${error.name}: ${error.message}`.slice(0, 500) : String(error).slice(0, 500);
}
