CREATE TABLE empresa_responsaveis_modulo (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    modulo VARCHAR(40) NOT NULL,
    nome VARCHAR(160) NOT NULL,
    email VARCHAR(200),
    telefone VARCHAR(40),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_empresa_responsavel_modulo UNIQUE (empresa_id, modulo)
);

CREATE INDEX idx_empresa_responsaveis_modulo_empresa
    ON empresa_responsaveis_modulo (empresa_id, ativo, modulo);
