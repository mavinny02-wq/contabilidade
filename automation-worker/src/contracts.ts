import type { BrowserContext, Page } from 'playwright';

export type TipoIntervencao =
  | 'CAPTCHA'
  | 'AUTENTICACAO'
  | 'MFA'
  | 'CERTIFICADO'
  | 'CONFIRMACAO'
  | 'PORTAL_ALTERADO'
  | 'OUTRA';

export type ResultadoFluxo =
  | {
      status: 'SUCESSO';
      dados?: Record<string, unknown>;
      protocoloExterno?: string;
      custo?: number;
      moeda?: string;
    }
  | {
      status: 'AGUARDANDO_HUMANO';
      tipoIntervencao: TipoIntervencao;
      codigo: string;
      resumo?: string;
      tituloKey: string;
      instrucaoKey: string;
      sessaoReferencia?: string;
      timeoutMinutos?: number;
    }
  | {
      status: 'FALHA' | 'FONTE_INDISPONIVEL';
      erroCodigo: string;
      erroResumo?: string;
      retryable: boolean;
    };

export type ContextoFluxo = {
  execucaoId: string;
  empresaId?: string;
  provedorCodigo: string;
  operacao: string;
  parametros: Record<string, unknown>;
  browserContext: BrowserContext;
  page: Page;
};

export interface FluxoPortal {
  operacao: string;
  provedorCodigo: string;
  executar(contexto: ContextoFluxo): Promise<ResultadoFluxo>;
}

export type CapacidadeFluxo = {
  operacao: string;
  provedorCodigo: string;
};

export type ExecucaoLease = {
  id: string;
  empresaId?: string;
  operacao: string;
  provedorCodigo: string;
  payloadJson?: string;
  leaseToken: string;
  leaseAte: string;
  tentativa: number;
  maxTentativas: number;
};
