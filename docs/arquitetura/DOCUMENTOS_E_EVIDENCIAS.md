# Documentos e evidências

## Implementado

- metadados no PostgreSQL;
- arquivos no diretório configurado;
- hash SHA-256;
- tipos MIME permitidos;
- assinatura básica de PDF, PNG, JPEG e OOXML;
- rejeição de conteúdo textual com byte nulo;
- limite de tamanho;
- vínculo com empresa;
- download autorizado;
- auditoria de envio e download;
- remoção compensatória quando a persistência imediata falha.

A deduplicação atual retorna o documento ativo existente quando a mesma empresa envia o mesmo hash.

## Evolução

A interface `ArmazenamentoDocumento` permite provider S3/MinIO sem alterar o domínio. Ainda são
pendentes política de retenção, antivírus, preview seguro e reconciliação periódica de órfãos.

Backups devem incluir banco e diretório de documentos.
