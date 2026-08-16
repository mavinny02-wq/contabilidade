# Matriz de owners e hotspots

**Classificação:** `CANONICAL_ACTIVE_OWNER_MATRIX`

## Hotspots serializados

| Owner | Paths/autoridade | Regra |
|---|---|---|
| `ROOT_GOVERNANCE` | `AGENTS.md`, índices, locks | orquestrador/documentação direta |
| `ORCHESTRATION_STATE` | checkpoint, ledger, backlog, manifests correntes | orquestrador somente |
| `MIGRATION_LANE` | `backend/src/main/resources/db/migration/**` | máximo um owner |
| `STARTUP_DEPLOY` | Compose/startup/deploy/build workflow | serial |
| `DEPENDENCY_LOCKS` | POM, package manifests e lockfiles | owner explícito |
| `VERSION_RELEASE` | VERSION, tags, metadata, changelog | owner único |
| `FRONTEND_SHELL` | routing/i18n/clientes compartilhados | serial |
| `WORKER_RUNTIME` | leases/retry/browser/shutdown | serial |
| `DOCUMENT_STORAGE` | storage/download/preview/integrity | serial |
| `SECURITY_POLICY` | scanners, policy e exceções | owner único por wave |
| `DISPATCH_GOVERNANCE` | manifest/launcher/dispatch preflight | owner único por wave |
| `REQUIRED_CI_GATE` | check agregador estável e scripts `scripts/ci/**` | owner único |
| `COVERAGE_GOVERNANCE` | POM/package/lockfiles e `scripts/quality/**` | owner único de manifests |
| `API_CONTRACT` | OpenAPI, compatibility guard e mapa frontend | serial por contrato |
| `SYNTHETIC_DATA` | política/gerador/catálogo de fixtures sintéticas | paths próprios |
| `PERFORMANCE_BUDGET` | budgets e medição de artefatos | não altera produto |

## Wave 005

| ITEM | Classificação | Owner exclusivo | Escrita permitida |
|---|---|---|---|
| `STR-CI-001` | principal | `REQUIRED_CI_GATE` | novo workflow required, scripts/ci, testes e resultado; workflows existentes read-only |
| `STR-QA-001` | principal | `COVERAGE_GOVERNANCE` | POM/package/lockfiles, configs e scripts de coverage; sem workflow |
| `STR-API-001` | principal | `API_CONTRACT` | contratos OpenAPI, guard, fixtures e testes; manifests read-only |
| `STR-DATA-001` | extra | `SYNTHETIC_DATA` | `scripts/testing/**`, catálogo/policy/fixtures sintéticas e resultado |
| `STR-PERF-001` | extra | `PERFORMANCE_BUDGET` | `scripts/performance/**`, baseline/budgets e resultado; código de produto read-only |

## Independência

- os cinco partem do mesmo baseline de dispatch;
- nenhum owner de migration;
- `STR-CI-001` não incorpora outputs criados por outros slots da mesma wave;
- `STR-QA-001` é o único owner de `backend/pom.xml`, `frontend/package*.json` e
  `automation-worker/package*.json`;
- `STR-API-001` não altera manifests, lockfiles nem o required gate;
- `STR-DATA-001` não modifica o scanner de segredo/PII já integrado;
- `STR-PERF-001` mede e governa budgets, mas não otimiza código nesta task;
- checkpoint, ledger, backlog, shards e manifests são documentation-only do orquestrador;
- overlap descoberto torna o owner posterior `SUPERSEDED` ou serializado.

`OWNER_MATRIX_WAVE_005`
