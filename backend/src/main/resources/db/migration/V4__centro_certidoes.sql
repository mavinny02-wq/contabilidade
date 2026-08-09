CREATE TABLE certidoes_acompanhamento (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    estabelecimento_id UUID NOT NULL REFERENCES estabelecimentos(id),
    tipo VARCHAR(60) NOT NULL,
    resultado VARCHAR(50) NOT NULL,
    situacao_consulta VARCHAR(50) NOT NULL,
    numero_certidao VARCHAR(200),
    emitida_em DATE,
    valida_ate DATE,
    documento_id UUID REFERENCES documentos(id),
    ultimo_provedor_codigo VARCHAR(100),
    ultimo_modo_aquisicao VARCHAR(40),
    ultima_execucao_id UUID REFERENCES execucoes_integracao(id),
    observada_em TIMESTAMPTZ,
    proxima_consulta_em TIMESTAMPTZ,
    antecedencia_dias INTEGER NOT NULL DEFAULT 30,
    mensagem_fonte VARCHAR(1000),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    alerta_vencimento_em TIMESTAMPTZ,
    alerta_irregular_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_certidao_estabelecimento_tipo UNIQUE (estabelecimento_id, tipo),
    CONSTRAINT ck_certidao_validade CHECK (
        emitida_em IS NULL OR valida_ate IS NULL OR valida_ate >= emitida_em
    ),
    CONSTRAINT ck_certidao_resultado_concluido CHECK (
        situacao_consulta <> 'CONCLUIDA'
        OR (
            resultado <> 'DESCONHECIDO'
            AND (resultado = 'INCOMPLETA' OR documento_id IS NOT NULL)
            AND (
                resultado NOT IN ('REGULAR', 'POSITIVA_COM_EFEITO_NEGATIVA')
                OR (emitida_em IS NOT NULL AND valida_ate IS NOT NULL)
            )
        )
    )
);

CREATE INDEX idx_certidoes_empresa
    ON certidoes_acompanhamento (empresa_id, estabelecimento_id, tipo);
CREATE INDEX idx_certidoes_proxima_consulta
    ON certidoes_acompanhamento (proxima_consulta_em)
    WHERE ativa = TRUE;
CREATE INDEX idx_certidoes_validade
    ON certidoes_acompanhamento (valida_ate)
    WHERE ativa = TRUE;

CREATE TABLE historicos_certidao (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    acompanhamento_id UUID NOT NULL REFERENCES certidoes_acompanhamento(id),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    estabelecimento_id UUID NOT NULL REFERENCES estabelecimentos(id),
    tipo VARCHAR(60) NOT NULL,
    resultado VARCHAR(50) NOT NULL,
    situacao_consulta VARCHAR(50) NOT NULL,
    numero_certidao VARCHAR(200),
    emitida_em DATE,
    valida_ate DATE,
    documento_id UUID REFERENCES documentos(id),
    provedor_codigo VARCHAR(100),
    modo_aquisicao VARCHAR(40),
    execucao_id UUID REFERENCES execucoes_integracao(id),
    observada_em TIMESTAMPTZ NOT NULL,
    mensagem_fonte VARCHAR(1000),
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_historico_certidao_acompanhamento
    ON historicos_certidao (acompanhamento_id, observada_em DESC);
