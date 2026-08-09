ALTER TABLE estabelecimentos
    ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE execucoes_integracao
    ADD COLUMN IF NOT EXISTS prioridade INTEGER NOT NULL DEFAULT 100,
    ADD COLUMN IF NOT EXISTS payload_json TEXT,
    ADD COLUMN IF NOT EXISTS resultado_json TEXT,
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(200),
    ADD COLUMN IF NOT EXISTS lease_token UUID,
    ADD COLUMN IF NOT EXISTS lease_ate TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS worker_id VARCHAR(120),
    ADD COLUMN IF NOT EXISTS execucao_anterior_id UUID,
    ADD COLUMN IF NOT EXISTS cancelada_em TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS motivo_cancelamento VARCHAR(500);

CREATE UNIQUE INDEX IF NOT EXISTS uq_execucoes_idempotency_key
    ON execucoes_integracao (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_execucoes_fila
    ON execucoes_integracao (status, proxima_tentativa_em, prioridade DESC, criado_em ASC);

CREATE INDEX IF NOT EXISTS idx_execucoes_lease
    ON execucoes_integracao (lease_ate)
    WHERE status = 'EXECUTANDO';

ALTER TABLE definicoes_provedor
    ADD COLUMN IF NOT EXISTS pago BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS custo_estimado_padrao NUMERIC(14,4),
    ADD COLUMN IF NOT EXISTS moeda VARCHAR(3);

ALTER TABLE definicoes_provedor
    ADD CONSTRAINT ck_provedor_custo_nao_negativo
        CHECK (custo_estimado_padrao IS NULL OR custo_estimado_padrao >= 0),
    ADD CONSTRAINT ck_provedor_moeda
        CHECK (moeda IS NULL OR moeda ~ '^[A-Z]{3}$');

UPDATE definicoes_provedor
   SET pago = TRUE, moeda = 'BRL'
 WHERE codigo IN ('SERPRO', 'INFOSIMPLES');

INSERT INTO definicoes_provedor (
    id, versao, codigo, nome, tipo, habilitado, prioridade,
    timeout_segundos, max_retries, base_url, referencia_segredo,
    pago, custo_estimado_padrao, moeda, criado_em, atualizado_em
) VALUES (
    '10000000-0000-0000-0000-000000000006', 0,
    'MANUAL', 'Operação manual assistida', 'MANUAL', TRUE, 999,
    3600, 0, NULL, NULL, FALSE, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE politicas_aquisicao (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    operacao VARCHAR(100) NOT NULL UNIQUE,
    provedores_json TEXT NOT NULL,
    permitir_intervencao BOOLEAN NOT NULL DEFAULT TRUE,
    timeout_humano_minutos INTEGER NOT NULL DEFAULT 30,
    fallback_pago BOOLEAN NOT NULL DEFAULT FALSE,
    custo_maximo NUMERIC(14,4),
    moeda VARCHAR(3),
    habilitada BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_politica_timeout_humano
        CHECK (timeout_humano_minutos BETWEEN 1 AND 1440),
    CONSTRAINT ck_politica_custo
        CHECK (custo_maximo IS NULL OR custo_maximo >= 0),
    CONSTRAINT ck_politica_moeda
        CHECK (moeda IS NULL OR moeda ~ '^[A-Z]{3}$'),
    CONSTRAINT ck_politica_custo_moeda
        CHECK (custo_maximo IS NULL OR moeda IS NOT NULL)
);

INSERT INTO politicas_aquisicao (
    id, versao, operacao, provedores_json, permitir_intervencao,
    timeout_humano_minutos, fallback_pago, custo_maximo, moeda,
    habilitada, criado_em, atualizado_em
) VALUES
(
    '20000000-0000-0000-0000-000000000001', 0,
    'CERTIDAO_FEDERAL_RFB_PGFN',
    '["FEDERAL_PORTAL","SERPRO","INFOSIMPLES","MANUAL"]',
    TRUE, 30, FALSE, NULL, 'BRL', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    '20000000-0000-0000-0000-000000000002', 0,
    'CERTIDAO_SP_SEFAZ_NAO_INSCRITOS',
    '["SEFAZ_SP_PORTAL","INFOSIMPLES","MANUAL"]',
    TRUE, 30, FALSE, NULL, 'BRL', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    '20000000-0000-0000-0000-000000000003', 0,
    'CERTIDAO_SP_PGE_DIVIDA_ATIVA',
    '["PGE_SP_PORTAL","INFOSIMPLES","MANUAL"]',
    TRUE, 30, FALSE, NULL, 'BRL', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (operacao) DO NOTHING;

ALTER TABLE solicitacoes_intervencao
    ADD COLUMN IF NOT EXISTS iniciada_em TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS atribuida_para VARCHAR(200),
    ADD COLUMN IF NOT EXISTS observacao_resolucao VARCHAR(500);

CREATE UNIQUE INDEX IF NOT EXISTS uq_intervencao_aberta_execucao
    ON solicitacoes_intervencao (execucao_id)
    WHERE status IN ('PENDENTE', 'EM_ATENDIMENTO');
