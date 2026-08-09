import type { BrowserContext, Page } from 'playwright';

export type ResultadoFluxo = {
  status: 'SUCESSO' | 'AGUARDANDO_HUMANO' | 'FALHA' | 'FONTE_INDISPONIVEL';
  dados?: Record<string, unknown>;
  erroCodigo?: string;
  erroResumo?: string;
  sessaoReferencia?: string;
};

export type ContextoFluxo = {
  execucaoId: string;
  empresaId?: string;
  parametros: Record<string, unknown>;
  browserContext: BrowserContext;
  page: Page;
};

export interface FluxoPortal {
  codigo: string;
  executar(contexto: ContextoFluxo): Promise<ResultadoFluxo>;
}
