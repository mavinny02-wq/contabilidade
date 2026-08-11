CREATE TABLE tickets_sessao_interativa_consumidos (
    jti UUID PRIMARY KEY,
    sessao_id UUID NOT NULL,
    intervencao_id UUID NOT NULL REFERENCES solicitacoes_intervencao(id),
    execucao_id UUID NOT NULL REFERENCES execucoes_integracao(id),
    usuario VARCHAR(200) NOT NULL,
    worker_id VARCHAR(120) NOT NULL,
    expira_em TIMESTAMPTZ NOT NULL,
    consumido_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_sessao_consumido_expira
    ON tickets_sessao_interativa_consumidos (expira_em);

CREATE INDEX idx_ticket_sessao_consumido_intervencao
    ON tickets_sessao_interativa_consumidos (intervencao_id, consumido_em DESC);
