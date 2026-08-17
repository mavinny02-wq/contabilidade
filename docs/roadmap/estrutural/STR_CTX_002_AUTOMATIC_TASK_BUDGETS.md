# STR-CTX-002 — budgets automáticos por classe de task

## Dispatch

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_FAST_LANE_WAVE_008 --item STR-CTX-002 --baseline 77141fae2f04a430bc2cb51264886c083977a3ce \
  --key 8acd65e9ceb5d163e2011cc1968db320fed6a2c288a5f72bebe42e4c944fe802 --github-aware --register
```

## Owner

Pode alterar schema, policy, parser/agregador, fixtures e testes de telemetria sob
`scripts/orchestration/**`, além de `docs/implementacao/STR_CTX_002_RESULT.md`. Prompts, respostas,
produto, manifests e providers são read-only.

## Objetivo

Aplicar budgets determinísticos à telemetria integrada em `STR-CTX-001`, distinguindo classe de task
sem inferir conteúdo do prompt nem converter estimativa local em consumo reportado.

## Contrato mínimo

- evento declara `taskClass` explícita: `DOCUMENTATION`, `ANALYSIS`, `IMPLEMENTATION`,
  `VALIDATION` ou `RECONCILIATION`;
- catálogo versionado define warning/hard limit para input, output, total e custo por classe;
- resolução é determinística, com policy/default explícito e sem fallback oculto por modelo;
- `PROVIDER_REPORTED` e `LOCAL_ESTIMATE` permanecem separados;
- resultados são `WITHIN_BUDGET`, `BUDGET_WARNING`, `BUDGET_BREACH` ou
  `BUDGET_POLICY_MISSING`;
- CLI retorna código estável para breach, gera JSON/Markdown reproduzíveis e mostra top desvios;
- nenhum prompt, resposta, chain-of-thought, segredo ou PII é persistido;
- fixtures cobrem limite exato, warning, breach, moeda ausente, policy ausente, duplicata e redaction.

## Validação

Python standard library; schema/JSON válidos, testes unitários, duas execuções byte-idênticas,
compatibilidade com eventos anteriores classificada explicitamente e `git diff --check`.
