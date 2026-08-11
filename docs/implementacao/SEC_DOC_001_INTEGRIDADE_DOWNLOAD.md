# SEC-DOC-001 — Integridade do arquivo antes do download

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`

## Problema

O upload registrava tamanho e SHA-256, mas o download transmitia o arquivo atual do storage sem
recalcular esses valores. Uma alteração externa, corrupção de disco ou substituição indevida podia
entregar bytes diferentes da evidência registrada no PostgreSQL.

## Solução

O fluxo HTTP autorizado passou a:

1. carregar somente um documento ativo;
2. validar metadados de tamanho e SHA-256;
3. ler o conteúdo com limite configurável;
4. recalcular tamanho e SHA-256;
5. comparar o digest em tempo constante;
6. entregar uma cópia imutável dos mesmos bytes verificados;
7. gravar auditoria de download com `SHA256_VERIFICADO`.

Quando tamanho ou hash divergem:

- o download responde conflito e não entrega conteúdo;
- o arquivo não é excluído, renomeado ou sobrescrito;
- a ocorrência `DOCUMENTO_INTEGRIDADE_BLOQUEADA` é gravada em transação isolada;
- a auditoria contém somente documento, empresa, motivo e tamanhos seguros;
- hash bruto, referência de storage e conteúdo não são registrados.

Falha de leitura ou metadados inválidos também bloqueiam o download com mensagem específica.

## Configuração

```text
APP_STORAGE_INTEGRITY_MAX_FILE_SIZE_BYTES=52428800
```

O padrão de 50 MiB é superior ao limite atual de upload de 25 MiB. O limite impede que um arquivo de
storage adulterado cause alocação de memória sem controle durante a verificação.

## Arquivos principais

- `backend/src/main/java/br/com/contabilidade/common/document/DocumentoIntegridadeService.java`;
- `backend/src/main/java/br/com/contabilidade/common/document/DocumentoDownloadService.java`;
- `backend/src/main/java/br/com/contabilidade/common/document/DocumentoController.java`;
- `backend/src/main/java/br/com/contabilidade/common/audit/AuditoriaService.java`;
- `backend/src/main/resources/messages_pt_BR.properties`;
- `backend/src/main/resources/application.yml`;
- `docs/arquitetura/DOCUMENTOS_E_EVIDENCIAS.md`.

## Comportamento preservado

- autorização `DOCUMENTO_BAIXAR`;
- nome e MIME type registrados;
- deduplicação de upload;
- storage local e abstração `ArmazenamentoDocumento`;
- auditoria de download aprovado;
- documento divergente permanece disponível para investigação administrativa, mas não para download.

## Validações ainda necessárias

- compilação Maven Java 21;
- download de arquivo íntegro com `Content-Length` correto;
- alteração controlada de um byte no storage e resposta
  `DOCUMENTO_INTEGRIDADE_DIVERGENTE`;
- arquivo maior/menor que o tamanho registrado;
- hash registrado inválido;
- arquivo ausente ou ilegível;
- confirmação da auditoria persistida mesmo quando o download é recusado;
- concorrência entre download e alteração administrativa do storage.

## Limitação consciente

A resposta verificada é mantida em memória até o limite configurado para garantir que os bytes
transmitidos sejam exatamente os bytes validados. Uma futura implementação S3/MinIO poderá usar
stream ou arquivo temporário imutável com o mesmo contrato de integridade.
