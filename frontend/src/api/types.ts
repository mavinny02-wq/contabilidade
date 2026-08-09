export type Pagina<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export type StatusEmpresa = 'ATIVA' | 'INATIVA' | 'SUSPENSA' | 'BAIXADA' | 'DESCONHECIDA';
export type RegimeTributario =
  | 'MEI'
  | 'SIMPLES_NACIONAL'
  | 'LUCRO_PRESUMIDO'
  | 'LUCRO_REAL'
  | 'OUTRO'
  | 'NAO_INFORMADO';

export type EmpresaResumo = {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  status?: StatusEmpresa;
  regimeTributario?: RegimeTributario;
  municipio?: string;
  uf?: string;
  ativa: boolean;
  quantidadeEstabelecimentos: number;
  atualizadoEm: string;
};

export type Estabelecimento = {
  id: string;
  cnpj: string;
  matriz: boolean;
  ativo: boolean;
  status: StatusEmpresa;
  cnaePrincipal?: string;
  regimeTributario: RegimeTributario;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
};

export type EmpresaDetalhe = {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  ativa: boolean;
  responsavelNome?: string;
  responsavelEmail?: string;
  estabelecimentos: Estabelecimento[];
  criadoEm: string;
  atualizadoEm: string;
};

export type EmpresaPayload = {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  status: StatusEmpresa;
  cnaePrincipal?: string;
  regimeTributario: RegimeTributario;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  responsavelNome?: string;
  responsavelEmail?: string;
};

export type FilialPayload = Omit<EmpresaPayload, 'razaoSocial' | 'nomeFantasia' | 'responsavelNome' | 'responsavelEmail'>;

export type DashboardResumo = {
  empresasAtivas: number;
  documentosAtivos: number;
  execucoesAbertas: number;
  intervencoesPendentes: number;
  notificacoesNaoLidas: number;
  certidoesRegulares?: number;
  certidoesAtencao?: number;
  certidoesAcaoManual?: number;
};

export type Documento = {
  id: string;
  empresaId: string;
  tipo: string;
  nomeOriginal: string;
  mimeType: string;
  tamanhoBytes: number;
  hashSha256: string;
  origem: string;
  emitidoEm?: string;
  validoAte?: string;
  criadoEm: string;
};

export type StatusExecucao =
  | 'NA_FILA'
  | 'EXECUTANDO'
  | 'RETRY_AGENDADO'
  | 'AGUARDANDO_HUMANO'
  | 'AGUARDANDO_CAPTCHA'
  | 'AGUARDANDO_AUTENTICACAO'
  | 'SUCESSO'
  | 'PARCIAL'
  | 'FALHA'
  | 'FONTE_INDISPONIVEL'
  | 'CANCELADO';

export type Execucao = {
  id: string;
  empresaId?: string;
  operacao: string;
  provedorCodigo?: string;
  status: StatusExecucao;
  prioridade: number;
  tentativas: number;
  maxTentativas: number;
  proximaTentativaEm?: string;
  iniciadaEm?: string;
  finalizadaEm?: string;
  erroCodigo?: string;
  erroResumo?: string;
  protocoloExterno?: string;
  custoEstimado?: number;
  moeda?: string;
  payloadJson?: string;
  resultadoJson?: string;
  workerId?: string;
  leaseAte?: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type StatusIntervencao = 'PENDENTE' | 'EM_ATENDIMENTO' | 'RESOLVIDA' | 'EXPIRADA' | 'CANCELADA';
export type TipoIntervencao =
  | 'CAPTCHA'
  | 'AUTENTICACAO'
  | 'MFA'
  | 'CERTIFICADO'
  | 'CONFIRMACAO'
  | 'PORTAL_ALTERADO'
  | 'OUTRA';

export type Intervencao = {
  id: string;
  execucaoId: string;
  empresaId?: string;
  tipo: TipoIntervencao;
  status: StatusIntervencao;
  tituloKey: string;
  instrucaoKey: string;
  sessaoReferencia?: string;
  expiraEm?: string;
  iniciadaEm?: string;
  atribuidaPara?: string;
  resolvidaEm?: string;
  resolvidaPor?: string;
  criadoEm: string;
};

export type Notificacao = {
  id: string;
  tipo: string;
  tituloKey: string;
  mensagemKey: string;
  deepLink?: string;
  lida: boolean;
  criadoEm: string;
  lidaEm?: string;
};

export type TipoProvedor =
  | 'API_OFICIAL'
  | 'API_COMERCIAL'
  | 'PORTAL_AUTOMATIZADO'
  | 'PORTAL_ASSISTIDO'
  | 'MANUAL';

export type Provedor = {
  id: string;
  codigo: string;
  nome: string;
  tipo: TipoProvedor;
  habilitado: boolean;
  prioridade: number;
  timeoutSegundos: number;
  maxRetries: number;
  baseUrl?: string;
  referenciaSegredo?: string;
  pago: boolean;
  custoEstimadoPadrao?: number;
  moeda?: string;
};

export type PoliticaAquisicao = {
  operacao: string;
  provedores: string[];
  permitirIntervencao: boolean;
  timeoutHumanoMinutos: number;
  fallbackPago: boolean;
  custoMaximo?: number;
  moeda?: string;
  habilitada: boolean;
};

export type TipoCertidao =
  | 'FEDERAL_RFB_PGFN'
  | 'SP_SEFAZ_NAO_INSCRITOS'
  | 'SP_PGE_DIVIDA_ATIVA';

export type ResultadoCertidao =
  | 'DESCONHECIDO'
  | 'REGULAR'
  | 'POSITIVA_COM_EFEITO_NEGATIVA'
  | 'IRREGULAR'
  | 'INCOMPLETA';

export type SituacaoConsultaCertidao =
  | 'NAO_CONSULTADA'
  | 'AGENDADA'
  | 'EM_PROCESSAMENTO'
  | 'CONCLUIDA'
  | 'FONTE_INDISPONIVEL'
  | 'ACAO_MANUAL_NECESSARIA'
  | 'FALHA';

export type StatusCertidao =
  | 'NAO_CONSULTADA'
  | 'AGENDADA'
  | 'EM_PROCESSAMENTO'
  | 'REGULAR'
  | 'POSITIVA_COM_EFEITO_NEGATIVA'
  | 'IRREGULAR'
  | 'INCOMPLETA'
  | 'FONTE_INDISPONIVEL'
  | 'ACAO_MANUAL_NECESSARIA'
  | 'PROXIMA_DO_VENCIMENTO'
  | 'VENCIDA'
  | 'FALHA';

export type Certidao = {
  id: string;
  empresaId: string;
  estabelecimentoId: string;
  cnpj: string;
  tipo: TipoCertidao;
  resultado: ResultadoCertidao;
  situacaoConsulta: SituacaoConsultaCertidao;
  status: StatusCertidao;
  numeroCertidao?: string;
  emitidaEm?: string;
  validaAte?: string;
  documentoId?: string;
  ultimoProvedorCodigo?: string;
  ultimoModoAquisicao?: TipoProvedor;
  ultimaExecucaoId?: string;
  observadaEm?: string;
  proximaConsultaEm?: string;
  antecedenciaDias: number;
  mensagemFonte?: string;
  atualizadoEm: string;
};

export type HistoricoCertidao = {
  id: string;
  acompanhamentoId: string;
  tipo: TipoCertidao;
  resultado: ResultadoCertidao;
  situacaoConsulta: SituacaoConsultaCertidao;
  numeroCertidao?: string;
  emitidaEm?: string;
  validaAte?: string;
  documentoId?: string;
  provedorCodigo?: string;
  modoAquisicao?: TipoProvedor;
  execucaoId?: string;
  observadaEm: string;
  mensagemFonte?: string;
};

export type ResumoTecnico = {
  observadoEm: string;
  banco: { componente: string; status: string; detalheSeguro?: string };
  storage: { componente: string; status: string; detalheSeguro?: string };
  execucoesAbertas: number;
  execucoesComFalha: number;
  intervencoesPendentes: number;
};

export type EventoAuditoria = {
  id: string;
  acao: string;
  recursoTipo: string;
  recursoId?: string;
  ator: string;
  correlationId?: string;
  detalhesJson?: string;
  criadoEm: string;
};

export type ResultadoBusca = {
  tipo: string;
  id: string;
  titulo: string;
  subtitulo?: string;
  destino: string;
};
