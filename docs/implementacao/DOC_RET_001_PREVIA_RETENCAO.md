# DOC-RET-001 — Prévia read-only de retenção documental

## Objetivo

Permitir que a equipe visualize documentos que atendem a critérios configuráveis de retenção antes
de qualquer decisão de descarte. A funcionalidade é deliberadamente somente leitura e não altera o
PostgreSQL nem o storage.

## Escopo implementado

- endpoint `GET /api/documentos/retencao-preview`;
- filtro opcional por empresa;
- critérios configuráveis para documento inativo, validade expirada e documento antigo sem validade;
- consulta bounded com limite máximo de itens detalhados;
- total geral de candidatos e indicação explícita de resultado parcial;
- tamanho total da amostra analisada;
- contagem por motivo;
- metadados seguros por documento;
- interface na página Documentos;
- auditoria isolada da prévia somente com contagens e presença de filtro.

## Critérios padrão

```text
APP_DOCUMENT_RETENTION_INACTIVE_DAYS=365
APP_DOCUMENT_RETENTION_EXPIRED_GRACE_DAYS=365
APP_DOCUMENT_RETENTION_NO_EXPIRY_DAYS=3650
APP_DOCUMENT_RETENTION_PREVIEW_MAX_ROWS=1000
```

Um documento é candidato quando atende a pelo menos um critério:

1. está inativo e não é atualizado há `retention-inactive-days`;
2. sua validade terminou há `retention-expired-grace-days`;
3. não possui validade e foi criado há `retention-no-expiry-days`.

Os valores são limites de triagem, não autorização para exclusão.

## Resposta

A resposta contém:

- momento da análise;
- empresa filtrada, quando houver;
- critérios efetivos;
- total de candidatos;
- total detalhado;
- flag `parcial`;
- tamanho analisado;
- contagem por motivo;
- ID, empresa, tipo, nome original, MIME, tamanho, origem, datas e estado ativo dos itens.

Não contém:

- referência do storage;
- SHA-256;
- conteúdo do documento;
- credenciais, tokens ou payload fiscal.

## Segurança e governança

- exige `DOCUMENTO_LER`;
- não executa `DELETE`, `UPDATE`, inativação ou movimentação de arquivo;
- não oferece botão de exclusão;
- não chama provider externo;
- não cria migration;
- a auditoria `RETENCAO_DOCUMENTAL_PREVISUALIZADA` não registra IDs, nomes ou critérios sensíveis;
- exclusão futura exigirá decisão de governança, autorização própria, trilha de aprovação e prova de backup.

## Limites

A consulta usa uma página ordenada pelos documentos mais antigos. `totalCandidatos` vem da contagem
do banco, enquanto `itens` é limitado por `retention-preview-max-rows`. Quando há mais candidatos,
`parcial=true` impede que a amostra seja interpretada como inventário completo.

## Validação pendente

- Maven completo;
- i18n, typecheck e build do frontend;
- nenhum candidato;
- cada critério isoladamente;
- documento atendendo a múltiplos critérios;
- filtro por empresa e isolamento entre empresas;
- limite atingido e flag parcial;
- soma de tamanhos e contagem por motivo;
- permissão `DOCUMENTO_LER`;
- auditoria sem IDs, nomes, hashes ou paths;
- confirmação de zero alteração no banco e no storage.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
