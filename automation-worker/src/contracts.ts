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

export type OrigemDocumentoWorker =
  | 'API_OFICIAL'
  | 'API_COMERCIAL'
  | 'PORTAL_AUTOMATIZADO'
  | 'PORTAL_ASSISTIDO'
  | 'SISTEMA';

export type DocumentoWorkerInput = {
  empresaId: string;
  tipo: string;
  origem: OrigemDocumentoWorker;
  arquivoPath: string;
  mimeType: string;
  nomeArquivo?: string;
  emitidoEm?: string;
  validoAte?: string;
};

export type DocumentoWorkerBytesInput = Omit<DocumentoWorkerInput, 'arquivoPath'> & {
  bytes: Uint8Array;
};

export type DocumentoRuntime = {
  enviar(input: DocumentoWorkerInput): Promise<{ id: string }>;
  enviarBytes(input: DocumentoWorkerBytesInput): Promise<{ id: string }>;
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
      /** Compatibilidade com fluxos que encerram no primeiro handoff humano. */
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
      custo?: number;
      moeda?: string;
    };

export type ContextoFluxoBase = {
  execucaoId: string;
  empresaId?: string;
  provedorCodigo: string;
  operacao: string;
  parametros: Record<string, unknown>;
  documentos: DocumentoRuntime;
};

export type ContextoFluxoPortal = ContextoFluxoBase & {
  browserContext: BrowserContext;
  page: Page;
  intervencao: IntervencaoRuntime;
};

export type ContextoFluxoApi = ContextoFluxoBase;

export type DiagnosticoFluxo = {
  configurado: boolean;
  modoAutenticacao?: string;
  destino?: string;
  detalheSeguro?: string;
};

export interface FluxoPortal {
  readonly modo: 'PORTAL';
  readonly operacao: string;
  readonly provedorCodigo: string;
  executar(contexto: ContextoFluxoPortal): Promise<ResultadoFluxo>;
  diagnostico?(): DiagnosticoFluxo;
}

export interface FluxoApi {
  readonly modo: 'API';
  readonly operacao: string;
  readonly provedorCodigo: string;
  executar(contexto: ContextoFluxoApi): Promise<ResultadoFluxo>;
  diagnostico?(): DiagnosticoFluxo;
}

export type FluxoIntegracao = FluxoPortal | FluxoApi;

export type CapacidadeFluxo = {
  operacao: string;
  provedorCodigo: string;
  modo: FluxoIntegracao['modo'];
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
