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
  `docs/implementacao/SEC_DOC_001_INTEGRIDADE_DOWNLOAD.md`.

## Pendências

- lockfiles/build runtime;
- testes de concorrência;
- storage S3/MinIO;
- secret manager;
- retenção documental;
- e-mail;
- administração de usuários;
- histórico de saúde/custo por provider;
- hardening e observabilidade de produção;
- antivírus e reconciliação periódica de órfãos do storage.
