# Matriz de owners e hotspots

**Classificação:** `CANONICAL_ACTIVE_OWNER_MATRIX`

## Hotspots serializados

| Owner | Paths/autoridade | Regra |
|---|---|---|
| `ROOT_GOVERNANCE` | AGENTS, índices, locks | orquestrador/documentação direta |
| `ORCHESTRATION_STATE` | checkpoint, ledger, backlog, manifests | orquestrador somente |
| `MIGRATION_LANE` | `backend/src/main/resources/db/migration/**` | máximo um owner |
| `REQUIRED_CI_GATE` | `.github/workflows/required-ci.yml`, `scripts/ci/**` | bloqueado por setting externo |
| `FULLSTACK_POST_W006_VALIDATION` | produto read-only + resultado de smoke | validação consolidada |
| `FRONTEND_ACCESSIBILITY` | frontend, testes a11y/browser e lockfile se necessário | único owner frontend |
| `API_CONSUMER_CONTRACT` | `scripts/contracts/**`, contrato consumer | frontend read-only |
| `WORKER_COVERAGE_COMPLETE` | testes worker e seção worker do baseline de coverage | produção worker read-only |
| `ORCHESTRATION_TOKEN_TELEMETRY` | profiler/telemetria em `scripts/orchestration/**` | sem prompt bruto |
| `DEPENDENCY_LOCKS` | POM/package/lockfiles | owner explícito |
| `STARTUP_DEPLOY` | Compose/startup/deploy | serial |

## Fast Lane Wave 007

| ITEM | Owner exclusivo | Escrita permitida |
|---|---|---|
| `VAL-W006-FULLSTACK-007` | `FULLSTACK_POST_W006_VALIDATION` | somente `RESULT_MD`; produto read-only |
| `STR-FE-001` | `FRONTEND_ACCESSIBILITY` | frontend a11y/browser, testes e dependência dev justificada |
| `STR-API-002` | `API_CONSUMER_CONTRACT` | contracts/scripts focados; frontend read-only |
| `STR-QA-WRK-002` | `WORKER_COVERAGE_COMPLETE` | testes worker e worker coverage baseline; produção read-only |
| `STR-CTX-001` | `ORCHESTRATION_TOKEN_TELEMETRY` | scripts/schema/fixtures de telemetria e resultado |

## Independência

- todos usam a baseline `d4c5391ebcf44b9fc7d3a7db7a488a5e7564889b`;
- nenhum owner cria migration;
- documentação canônica fica fora dos executores;
- o smoke não altera produto;
- acessibilidade é o único owner de escrita no frontend;
- API consumer apenas lê call sites do frontend;
- worker coverage não altera runtime;
- token telemetry não lê ou persiste prompts;
- overlap descoberto torna o owner posterior `SUPERSEDED` ou serializado.

`OWNER_MATRIX_FAST_LANE_WAVE_007`
