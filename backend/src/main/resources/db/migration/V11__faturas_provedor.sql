CREATE TABLE faturas_provedor (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    provedor_codigo VARCHAR(100) NOT NULL REFERENCES definicoes_provedor(codigo),
    competencia_inicio DATE NOT NULL,
    competencia_fim DATE NOT NULL,
    moeda VARCHAR(3) NOT NULL,
    valor_faturado NUMERIC(14, 4) NOT NULL,
    referencia VARCHAR(120),
    observacao VARCHAR(500),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_fatura_provedor_periodo CHECK (competencia_fim >= competencia_inicio),
    CONSTRAINT ck_fatura_provedor_valor CHECK (valor_faturado >= 0),
    CONSTRAINT ck_fatura_provedor_moeda CHECK (moeda ~ '^[A-Z]{3}$'),
    CONSTRAINT uk_fatura_provedor_competencia UNIQUE (
        provedor_codigo,
        competencia_inicio,
        competencia_fim,
        moeda
    )
);

CREATE INDEX idx_faturas_provedor_competencia
    ON faturas_provedor (competencia_inicio DESC, provedor_codigo, moeda);
