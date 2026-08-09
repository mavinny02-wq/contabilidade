# Documentos e evidências

## Baseline

- metadata no PostgreSQL;
- arquivos no diretório configurado;
- hash SHA-256;
- MIME type permitido;
- limite de tamanho;
- download autorizado;
- auditoria de envio e download.

## Evolução

A interface `ArmazenamentoDocumento` permitirá provider S3/MinIO sem alterar o domínio.
Backups devem incluir banco e diretório de documentos.
