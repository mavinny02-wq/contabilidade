# AUD-EXP-001 — Exportação CSV da auditoria

## Objetivo

Permitir extração operacional dos metadados de auditoria com filtros e limites, sem exportar o
conteúdo detalhado dos eventos.

## Endpoints

```text
GET /api/auditoria
GET /api/auditoria/exportacao.csv
```

Ambos aceitam:

- `acao` — contém, sem diferenciar maiúsculas/minúsculas;
- `recursoTipo` — contém;
- `ator` — contém;
- `inicio` — data inicial no fuso `America/Sao_Paulo`;
- `fim` — data final inclusiva no mesmo fuso.

A listagem continua paginada. A exportação exige `AUDITORIA_LER`.

## Conteúdo exportado

- ID do evento;
- data/hora;
- ação;
- tipo e ID do recurso;
- ator;
- correlation ID.

`detalhes_json` não é incluído no CSV, reduzindo o risco de exportar dados operacionais ou fiscais
incorporados em eventos históricos.

## Segurança

- CSV UTF-8 com BOM e separador `;`;
- campos delimitados e quebras de linha normalizadas;
- proteção contra fórmula de planilha para `=`, `+`, `-`, `@` e tab;
- wildcards `%` e `_` nos filtros são tratados como texto;
- resposta `no-store` e `nosniff`;
- snapshot temporal evita deslocamento por novos eventos durante paginação;
- limite total é verificado antes da geração;
- o evento `AUDITORIA_EXPORTADA_CSV` registra apenas quantidade, presença dos filtros e período.

## Configuração

```text
APP_AUDIT_EXPORT_BATCH_SIZE=500
APP_AUDIT_EXPORT_MAX_ROWS=50000
```

O lote aceita de 10 a 5.000 registros; o teto aceita até 200.000.

## Interface

A página Auditoria ganhou:

- filtros de ação, recurso, ator e período;
- paginação;
- total encontrado;
- botão Exportar CSV;
- informação de que detalhes JSON não são exportados.

Todos os textos usam i18n pt-BR.

## Validação realizada

- revisão estática das Specifications e do intervalo de datas;
- revisão do snapshot, paginação e limite;
- revisão de escaping e proteção contra fórmula;
- revisão da exclusão de `detalhes_json`;
- nenhuma migration ou chamada externa.

## Validação runtime pendente

- Maven completo;
- i18n, typecheck e build frontend;
- filtros isolados e combinados;
- período inválido;
- arquivo vazio;
- limite excedido;
- caracteres `%`, `_`, aspas e fórmulas;
- auditoria da própria exportação sem ator bruto nos detalhes.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
