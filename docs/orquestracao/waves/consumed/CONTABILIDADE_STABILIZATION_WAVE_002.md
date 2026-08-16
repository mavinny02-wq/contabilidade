# Contabilidade Stabilization Wave 002

**Classificação:** `CANONICAL_CONSUMED_WAVE`  
**Status:** `CONSUMED`  
**Preparada contra:** `main@4c07f16a8a66abb76983c9203c8e694c748f0af0`  
**Reconciliada na main:** `91a42c8e96775f2cbe3c09481beed879d4fbab31`  
**Migration owner:** `NONE`

## Objetivo consumido

Fechar as lacunas Cloud de infraestrutura, PostgreSQL e runtime Node suportado sem repetir o
full-stack amplo já verde.

## Resultados integrados

| Slot | ITEM | PR | Resultado | Disposição |
|---:|---|---:|---|---|
| 1 | `BUG-INFRA-001` | `#65` | guard Docker e testes de regressão verdes | `PASS / NO_SUCCESSOR` |
| 2 | `VAL-STAB-BACKEND-PG-002` | `#66` | Maven verify, 5 testes e Flyway V1–V12 verdes | `PASS / REUSE_PASS` |
| 3 | `VAL-STAB-FRONTEND-NODE24-002` | `#67` | Node 24, i18n, typecheck, 20 testes e build verdes | `PASS / REUSE_PASS` |
| 4 | `VAL-STAB-WORKER-NODE24-PW-002` | `#68` | Node 24, Chromium, 7 testes e build verdes | `PASS / REUSE_PASS` |

## Evidência preservada

- `docs/implementacao/BUG_INFRA_001_RESULT.md`;
- `docs/testing/runs/VAL_STAB_BACKEND_PG_002.md`;
- `docs/testing/runs/VAL_STAB_FRONTEND_NODE24_002.md`;
- `docs/testing/runs/VAL_STAB_WORKER_NODE24_PW_002.md`.

## Classificação

Nenhum resultado exige correção de backend, frontend ou worker.

Avisos não bloqueantes:

- chunk frontend acima do warning padrão;
- avisos npm `allowScripts`/configuração obsoleta;
- aviso futuro de instrumentação Byte Buddy;
- dependências de sistema do Chromium exigem preparação completa do executor.

Esses avisos não reabrem a wave.

## Limitações restantes fora da Wave 002

- startup oficial Windows/Docker Desktop;
- segundo startup e reuso do PostgreSQL/volumes;
- on-premise + Keycloak;
- coletor Windows ainda sem provas reais de runtime;
- branch protection;
- coverage agregado.

## Encerramento

Esta wave não pode ser relançada. As evidências verdes são reutilizadas até delta material no owner.
O successor exato é `CONTABILIDADE_STABILIZATION_WAVE_003`.

`CONTABILIDADE_STABILIZATION_WAVE_002_CONSUMED`
