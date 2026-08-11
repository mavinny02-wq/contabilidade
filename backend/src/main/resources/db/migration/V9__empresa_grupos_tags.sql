ALTER TABLE empresas
    ADD COLUMN grupo VARCHAR(100);

CREATE TABLE empresa_tags (
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tag VARCHAR(60) NOT NULL,
    PRIMARY KEY (empresa_id, tag)
);

CREATE UNIQUE INDEX uk_empresa_tags_normalizada
    ON empresa_tags (empresa_id, lower(tag));

CREATE INDEX idx_empresa_tags_busca
    ON empresa_tags (lower(tag));
