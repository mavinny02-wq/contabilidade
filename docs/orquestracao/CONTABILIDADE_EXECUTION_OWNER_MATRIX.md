# Matriz de owners e hotspots

**Classificação:** `CANONICAL_ACTIVE_OWNER_MATRIX`

## Hotspots serializados

| Owner | Paths/autoridade | Regra |
|---|---|---|
| `ROOT_GOVERNANCE` | AGENTS, índices, locks | orquestrador/documentação direta |
| `ORCHESTRATION_STATE` | checkpoint, ledger, backlog, manifests | orquestrador somente |
| `MIGRATION_LANE` | `backend/src/main/resources/db/migration/**` | máximo um owner |
| `REQUIRED_CI_GATE` | `.github/workflows/required-ci.yml`, `scripts/ci/**` | bloqueado por setting externo |
| `DEPENDENCY_LOCKS` | POM/package/lockfiles | owner explícito |
| `STARTUP_DEPLOY` | Compose/startup/deploy | serial |
| `FULLSTACK_POST_W007_VALIDATION` | produto read-only + resultado de smoke | validação consolidada |
| `BACKEND_EXECUTION_CRITICAL_TESTS` | testes de `common/execution`; produção read-only | não altera baseline global |
| `OPERATIONAL_SLO_ALERTING` | observabilidade backend, regras, guard e runbook | labels bounded; sem provider |
| `WORKER_COMPOSITION_BOUNDARY` | composition root worker + inventário arquitetural | fluxos concretos preservados |
| `ORCHESTRATION_TASK_BUDGETS` | policy/schema/parser/tests de budgets | sem prompt/resposta brutos |

## Fast Lane Wave 008

| ITEM | Owner exclusivo | Escrita permitida |
|---|---|---|
| `VAL-W007-FULLSTACK-008` | `FULLSTACK_POST_W007_VALIDATION` | somente `docs/testing/runs/VAL_W007_FULLSTACK_008.md`; produto read-only |
| `STR-QA-BE-001` | `BACKEND_EXECUTION_CRITICAL_TESTS` | testes backend de execução e resultado; produção/POM/baseline read-only |
| `STR-OBS-002` | `OPERATIONAL_SLO_ALERTING` | pacote observability, `infra/observability`, guard, testes, runbook e resultado |
| `STR-ARCH-002` | `WORKER_COMPOSITION_BOUNDARY` | `index.ts`, nova composition, testes e inventário/allowlist arquitetural |
| `STR-CTX-002` | `ORCHESTRATION_TASK_BUDGETS` | schema/policy/parser/fixtures/tests de budgets e resultado |

## Independência

- todos usam a baseline `77141fae2f04a430bc2cb51264886c083977a3ce`;
- nenhum owner cria migration;
- documentação canônica fica fora dos executores;
- o smoke escreve somente seu relatório e não corrige produção;
- backend quality altera somente testes de execução;
- observabilidade não toca testes/produção de execução nem worker;
- arquitetura altera somente a composição do worker e o inventário correspondente;
- budgets alteram somente tooling de orquestração e nunca conteúdo de prompts;
- overlap descoberto torna o owner posterior `SUPERSEDED` ou exige nova onda.

`OWNER_MATRIX_FAST_LANE_WAVE_008`
