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
- recálculo de tamanho e SHA-256 antes de cada download HTTP;
- entrega dos mesmos bytes verificados, evitando alteração entre verificação e resposta;
- bloqueio com erro acionável quando o conteúdo diverge ou não pode ser verificado;
- auditoria isolada de divergência, inclusive quando a transação do download falha;
- auditoria de envio e download;
- remoção compensatória quando a persistência imediata falha.

A deduplicação atual retorna o documento ativo existente quando a mesma empresa envia o mesmo hash.

## Integridade no download

O endpoint autorizado de conteúdo não transmite diretamente o `Resource` do storage. O arquivo é
lido com limite configurável, o tamanho registrado e o SHA-256 são recalculados e somente os bytes
aprovados são entregues ao cliente. Se houver divergência:

- o download é recusado;
- o arquivo não é removido nem sobrescrito;
- o estado documental permanece preservado para investigação;
- uma ocorrência segura é gravada na auditoria sem referência de storage, hash bruto ou conteúdo.

O limite de verificação é configurado por `APP_STORAGE_INTEGRITY_MAX_FILE_SIZE_BYTES` e deve ser no
mínimo igual ao maior arquivo aceito pela política de upload.

## Evolução

A interface `ArmazenamentoDocumento` permite provider S3/MinIO sem alterar o domínio. Ainda são
pendentes política de retenção, antivírus, preview seguro e reconciliação periódica de órfãos.

Backups devem incluir banco e diretório de documentos.
