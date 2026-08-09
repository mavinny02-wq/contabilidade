export type Pagina<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export type EmpresaResumo = {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  status?: string;
  regimeTributario?: string;
  municipio?: string;
  uf?: string;
  ativa: boolean;
  atualizadoEm: string;
};

export type Estabelecimento = {
  id: string;
  cnpj: string;
  matriz: boolean;
  status: string;
  cnaePrincipal?: string;
  regimeTributario: string;
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
  status: string;
  cnaePrincipal?: string;
  regimeTributario: string;
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

export type DashboardResumo = {
  empresasAtivas: number;
  documentosAtivos: number;
  execucoesAbertas: number;
  intervencoesPendentes: number;
  notificacoesNaoLidas: number;
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

export type Execucao = {
  id: string;
  empresaId?: string;
  operacao: string;
  provedorCodigo?: string;
  status: string;
  tentativas: number;
  maxTentativas: number;
  iniciadaEm?: string;
  finalizadaEm?: string;
  erroCodigo?: string;
  erroResumo?: string;
  protocoloExterno?: string;
  custoEstimado?: number;
  moeda?: string;
  criadoEm: string;
};

export type Intervencao = {
  id: string;
  execucaoId: string;
  empresaId?: string;
  tipo: string;
  status: string;
  tituloKey: string;
  instrucaoKey: string;
  sessaoReferencia?: string;
  expiraEm?: string;
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

export type Provedor = {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  habilitado: boolean;
  prioridade: number;
  timeoutSegundos: number;
  maxRetries: number;
  baseUrl?: string;
  referenciaSegredo?: string;
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
