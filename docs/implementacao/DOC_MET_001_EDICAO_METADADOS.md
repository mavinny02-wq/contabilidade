# DOC-MET-001 — Edição segura de metadados documentais

## Objetivo

Corrigir tipo, data de emissão e validade de um documento sem substituir a evidência armazenada e
sem permitir alterações no arquivo, hash, MIME, origem ou vínculo com a empresa.

## Implementação

- endpoint `PUT /api/documentos/{id}/metadados`;
- permissão existente `DOCUMENTO_ENVIAR`;
- campos editáveis:
  - `tipo`;
  - `emitidoEm`;
  - `validoAte`;
- modal na página Documentos;
- atualização imediata da linha exibida;
- a prévia de retenção é invalidada no frontend após a alteração.

## Campos imutáveis

A operação não aceita nem modifica:

- `empresaId`;
- nome original;
- MIME type;
- tamanho;
- SHA-256;
- origem;
- referência de storage;
- conteúdo;
- estado ativo.

## Validação e auditoria

- tipo obrigatório, limitado e composto por caracteres seguros;
- validade não pode anteceder a emissão;
- somente documentos ativos podem ser editados;
- documento inexistente ou de outro estado é tratado como não encontrado;
- auditoria `DOCUMENTO_METADADOS_ATUALIZADOS` registra apenas:
  - empresa;
  - indicador de alteração do tipo;
  - indicador de alteração da emissão;
  - indicador de alteração da validade;
- valores antigos e novos não são copiados para a auditoria.

## Provas runtime pendentes

- alteração isolada e combinada dos três campos;
- remoção de datas opcionais;
- validade anterior à emissão;
- tipo inválido e limites;
- documento inativo/inexistente;
- usuário sem `DOCUMENTO_ENVIAR`;
- hash, tamanho, MIME, origem, storage e conteúdo inalterados;
- integração com preview, download e retenção;
- auditoria sem valores;
- i18n, typecheck e build do frontend.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
