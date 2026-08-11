# Backlog Common

## Entregue

- fila PostgreSQL;
- lease e recuperação;
- retry/backoff;
- idempotência;
- fallback e políticas;
- intervenção;
- documentos;
- worker;
- auditoria/notificações;
- Console Técnica;
- custo acumulado por execução em sucesso, retry e falha;
- moeda imutável dentro da execução.

## Implementado após v0.5.1 — aguardando runtime

- `SEC-DOC-001`: recálculo de tamanho e SHA-256 antes do download, entrega dos mesmos bytes
  verificados, bloqueio de divergência e auditoria isolada; evidência em
  `docs/implementacao/SEC_DOC_001_INTEGRIDADE_DOWNLOAD.md`;
- `DOC-ORP-001`: reconciliação sob demanda entre PostgreSQL e storage, sem exclusão automática,
  sem seguir links e sem expor paths; evidência em
  `docs/implementacao/DOC_ORP_001_RECONCILIACAO_STORAGE.md`;
- `DOC-RET-001`: prévia read-only de retenção por critérios configuráveis, com limite, amostra
  parcial explícita e nenhuma alteração dos documentos; evidência em
  `docs/implementacao/DOC_RET_001_PREVIA_RETENCAO.md`;
- `DOC-PRE-001`: pré-visualização inline de PDF/PNG/JPEG após nova validação de tamanho e SHA-256,
  com headers restritivos e auditoria segura; evidência em
  `docs/implementacao/DOC_PRE_001_PREVIEW_SEGURO.md`;
- `DOC-MET-001`: correção de tipo, emissão e validade sem alterar arquivo, hash, MIME, origem ou
  storage; evidência em `docs/implementacao/DOC_MET_001_EDICAO_METADADOS.md`.

## Pendências

- lockfiles/build runtime;
- testes de concorrência;
- storage S3/MinIO;
- secret manager;
- aprovação e execução governada de retenção documental;
- e-mail;
- administração de usuários;
- hardening e observabilidade de produção;
- antivírus;
- agendamento periódico da reconciliação de storage após prova operacional.
