# Matriz de owners e hotspots

**Classificação:** `CANONICAL_ACTIVE_OWNER_MATRIX`

## Hotspots serializados

| Owner | Paths/autoridade | Regra |
|---|---|---|
| `ROOT_GOVERNANCE` | AGENTS, índices, locks | orquestrador/documentação direta |
| `ORCHESTRATION_STATE` | checkpoint, ledger, backlog, manifests | orquestrador somente |
| `MIGRATION_LANE` | `backend/src/main/resources/db/migration/**` | máximo um owner |
| `REQUIRED_CI_GATE` | `.github/workflows/required-ci.yml`, `scripts/ci/**` | owner único |
| `SUPPLY_CHAIN_SECURITY` | workflow/scripts/policy de supply chain | owner único |
| `FRONTEND_BUNDLE` | router, lazy boundaries, Vite chunk config | serial |
| `OBSERVABILITY` | correlação/logs/métricas backend-worker | serial |
| `ARCHITECTURE_GUARD` | scripts/baseline/workflow de boundaries | source read-only |
| `DEPENDENCY_LOCKS` | POM/package/lockfiles | owner explícito |
| `WORKER_RUNTIME` | lease/retry/browser/shutdown | serial |
| `STARTUP_DEPLOY` | Compose/startup/deploy | serial |

## Wave 006

| ITEM | Owner exclusivo | Escrita permitida |
|---|---|---|
| `STR-CI-002` | `REQUIRED_CI_GATE` | required-ci, canary opcional, `scripts/ci/**`, testes/result |
| `STR-SEC-002` | `SUPPLY_CHAIN_SECURITY` | novo workflow e `scripts/security/supply-chain/**` |
| `STR-FE-BUNDLE-001` | `FRONTEND_BUNDLE` | router/lazy/fallback/Vite/tests focados |
| `STR-OBS-001` | `OBSERVABILITY` | observability backend/worker e `BackendClient.ts` |
| `STR-ARCH-001` | `ARCHITECTURE_GUARD` | `scripts/architecture/**`, workflow próprio, baseline |

## Independência

- todos usam a baseline observada `a3344a15a0581fd7f76f78766c6432b46f9a361e`;
- nenhum owner cria migration;
- documentação canônica fica fora dos executores;
- `STR-CI-002` não altera workflows dedicados;
- `STR-SEC-002` não altera required-ci nem produto;
- `STR-FE-BUNDLE-001` é o único owner do frontend nesta wave;
- `STR-OBS-001` é o único owner de código backend/worker compartilhado;
- `STR-ARCH-001` lê produto, mas só escreve tooling;
- overlap descoberto torna o owner posterior `SUPERSEDED` ou serializado.

`OWNER_MATRIX_WAVE_006`
