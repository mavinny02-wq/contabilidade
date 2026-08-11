# OBS-PRV-001 — Histórico operacional e de custo dos providers

## Objetivo

Consolidar as execuções já registradas para apoiar operação, capacidade e conferência de custo sem
realizar novas chamadas aos providers.

## API

```http
GET /api/integracoes/provedores/historico
    ?inicio=YYYY-MM-DD
    &fim=YYYY-MM-DD
```

- exige `INTEGRACAO_LER`;
- período padrão de 30 dias;
- intervalo máximo de 366 dias;
- quantidade de providers limitada por configuração;
- flag `parcial` quando o limite de detalhamento é atingido.

## Métricas

Por provider:

- total de execuções;
- sucesso, parcial, falha, fonte indisponível, cancelada e aberta;
- taxa de sucesso;
- duração média quando início e fim estão registrados;
- data da execução mais recente;
- custo estimado acumulado separado por moeda.

O código `SEM_PROVEDOR` representa execuções criadas sem provider identificado.

## Segurança

- não retorna payload, resultado JSON, erro detalhado, protocolo, chave de idempotência ou empresa;
- não retorna segredo nem referência de segredo;
- não mistura moedas em um único total;
- não chama provider externo;
- nenhuma migration.

## Interface

A página `/integracoes/historico-provedores` oferece período configurável, métricas por provider e
acesso de volta à administração de integrações.

## Provas pendentes

- Maven completo;
- i18n, typecheck e build frontend;
- período padrão, inválido e superior a 366 dias;
- múltiplos status e moedas;
- cálculo de duração e taxa de sucesso;
- limite parcial;
- ausência de payload/segredo na resposta;
- usuário sem `INTEGRACAO_LER`.
