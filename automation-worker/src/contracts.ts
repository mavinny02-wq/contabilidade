import type { BrowserContext, Page } from 'playwright';

export type TipoIntervencao =
  | 'CAPTCHA'
  | 'AUTENTICACAO'
  | 'MFA'
  | 'CERTIFICADO'
  | 'CONFIRMACAO'
  | 'PORTAL_ALTERADO'
  | 'OUTRA';

export type IntervencaoRequest = {
  tipo: TipoIntervencao;
  codigo: string;
  resumo?: string;
  tituloKey: string;
  instrucaoKey: string;
  timeoutMinutos?: number;
};

export type ContinuacaoIntervencao = {
  sessionId: string;
  operator: string;
};

export type IntervencaoRuntime = {
  aguardar(request: IntervencaoRequest): Promise<ContinuacaoIntervencao>;
};

export type DocumentoWorkerInput = {
  empresaId: string;
  tipo: string;
  origem:
    | 'API_OFICIAL'
    | 'API_COMERCIAL'
    | 'PORTAL_AUTOMATIZADO'
    | 'PORTAL_ASSISTIDO'
    | 'SISTEMA';
  arquivoPath: string;
  mimeType: string;
  nomeArquivo?: string;
  emitidoEm?: string;
  validoAte?: string;
};

export type DocumentoRuntime = {
  enviar(input: DocumentoWorkerInput): Promise<{ id: string }>;
};

export type ResultadoFluxo =
  | {
      status: 'SUCESSO';
      dados?: Record<string, unknown>;
      protocoloExterno?: string;
      custo?: number;
      moeda?: string;
    }
  | {
      /** Compatibilidade com fluxos que ainda encerram no primeiro handoff humano. */
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
  intervencao: IntervencaoRuntime;
  documentos: DocumentoRuntime;
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
