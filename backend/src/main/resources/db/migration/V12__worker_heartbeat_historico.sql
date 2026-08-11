CREATE TABLE worker_heartbeat_historico (
    id UUID PRIMARY KEY,
    versao BIGINT NOT NULL DEFAULT 0,
    worker_id VARCHAR(120) NOT NULL,
    worker_versao VARCHAR(80) NOT NULL,
    status VARCHAR(40) NOT NULL,
    observado_em TIMESTAMPTZ NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_worker_heartbeat_historico_worker_data
    ON worker_heartbeat_historico (worker_id, observado_em DESC);

CREATE INDEX idx_worker_heartbeat_historico_data
    ON worker_heartbeat_historico (observado_em DESC);
