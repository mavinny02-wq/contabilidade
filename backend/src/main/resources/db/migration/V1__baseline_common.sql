CREATE TABLE empresas (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    responsavel_nome VARCHAR(160),
    responsavel_email VARCHAR(200),
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_empresas_razao_social ON empresas (lower(razao_social));
CREATE INDEX idx_empresas_nome_fantasia ON empresas (lower(nome_fantasia));

CREATE TABLE estabelecimentos (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    cnpj VARCHAR(14) NOT NULL UNIQUE,
    matriz BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL,
    cnae_principal VARCHAR(10),
    regime_tributario VARCHAR(30) NOT NULL,
    logradouro VARCHAR(200),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    municipio VARCHAR(100),
    uf VARCHAR(2),
    cep VARCHAR(8),
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_estabelecimentos_empresa ON estabelecimentos (empresa_id);
CREATE INDEX idx_estabelecimentos_cnpj ON estabelecimentos (cnpj);

CREATE TABLE inscricoes_tributarias (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    estabelecimento_id UUID NOT NULL REFERENCES estabelecimentos(id),
    tipo VARCHAR(20) NOT NULL,
    numero VARCHAR(60) NOT NULL,
    uf VARCHAR(2),
    municipio VARCHAR(100),
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_inscricao_tipo_estabelecimento UNIQUE (estabelecimento_id, tipo)
);

CREATE TABLE documentos (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    tipo VARCHAR(100) NOT NULL,
    nome_original VARCHAR(255) NOT NULL,
    mime_type VARCHAR(150) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    hash_sha256 VARCHAR(64) NOT NULL,
    origem VARCHAR(40) NOT NULL,
    referencia_storage VARCHAR(500) NOT NULL UNIQUE,
    emitido_em DATE,
    valido_ate DATE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_documentos_empresa ON documentos (empresa_id, criado_em DESC);
CREATE INDEX idx_documentos_hash ON documentos (empresa_id, hash_sha256);

CREATE TABLE execucoes_integracao (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    empresa_id UUID REFERENCES empresas(id),
    operacao VARCHAR(100) NOT NULL,
    provedor_codigo VARCHAR(100),
    status VARCHAR(40) NOT NULL,
    tentativas INTEGER NOT NULL DEFAULT 0,
    max_tentativas INTEGER NOT NULL DEFAULT 1,
    proxima_tentativa_em TIMESTAMPTZ,
    iniciada_em TIMESTAMPTZ,
    finalizada_em TIMESTAMPTZ,
    erro_codigo VARCHAR(100),
    erro_resumo VARCHAR(500),
    protocolo_externo VARCHAR(200),
    custo_estimado NUMERIC(14,4),
    moeda VARCHAR(3),
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_execucoes_status ON execucoes_integracao (status, criado_em);
CREATE INDEX idx_execucoes_empresa ON execucoes_integracao (empresa_id, criado_em DESC);

CREATE TABLE definicoes_provedor (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    nome VARCHAR(160) NOT NULL,
    tipo VARCHAR(40) NOT NULL,
    habilitado BOOLEAN NOT NULL DEFAULT FALSE,
    prioridade INTEGER NOT NULL DEFAULT 100,
    timeout_segundos INTEGER NOT NULL DEFAULT 60,
    max_retries INTEGER NOT NULL DEFAULT 1,
    base_url VARCHAR(500),
    referencia_segredo VARCHAR(200),
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL
);

CREATE TABLE solicitacoes_intervencao (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    execucao_id UUID NOT NULL REFERENCES execucoes_integracao(id),
    empresa_id UUID REFERENCES empresas(id),
    tipo VARCHAR(40) NOT NULL,
    status VARCHAR(30) NOT NULL,
    titulo_key VARCHAR(160) NOT NULL,
    instrucao_key VARCHAR(200) NOT NULL,
    sessao_referencia VARCHAR(300),
    expira_em TIMESTAMPTZ,
    resolvida_em TIMESTAMPTZ,
    resolvida_por VARCHAR(200),
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_intervencoes_status ON solicitacoes_intervencao (status, criado_em);

CREATE TABLE notificacoes (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    tipo VARCHAR(30) NOT NULL,
    titulo_key VARCHAR(160) NOT NULL,
    mensagem_key VARCHAR(200) NOT NULL,
    deep_link VARCHAR(500),
    destinatario VARCHAR(200),
    lida_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_notificacoes_lida ON notificacoes (lida_em, criado_em DESC);

CREATE TABLE eventos_auditoria (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    acao VARCHAR(100) NOT NULL,
    recurso_tipo VARCHAR(100) NOT NULL,
    recurso_id UUID,
    ator VARCHAR(200) NOT NULL,
    correlation_id VARCHAR(100),
    detalhes_json TEXT,
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_auditoria_recurso ON eventos_auditoria (recurso_tipo, recurso_id, criado_em DESC);
CREATE INDEX idx_auditoria_criado ON eventos_auditoria (criado_em DESC);

CREATE TABLE worker_heartbeats (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    worker_id VARCHAR(120) NOT NULL UNIQUE,
    worker_versao VARCHAR(80) NOT NULL,
    observado_em TIMESTAMPTZ NOT NULL,
    status VARCHAR(40) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL
);
