# Matriz de owners e hotspots

**Classificação:** `CANONICAL_ACTIVE_OWNER_MATRIX`

## Hotspots serializados

| Owner | Paths/autoridade | Regra |
|---|---|---|
| `ROOT_GOVERNANCE` | AGENTS, índices, locks | orquestrador/documentação direta |
| `ORCHESTRATION_STATE` | checkpoint, ledger, backlog, manifests | orquestrador somente |
| `MIGRATION_LANE` | `backend/src/main/resources/db/migration/**` | máximo um owner |
| `STARTUP_DEPLOY` | Compose/startup/deploy | serial e bloqueante |
| `STARTUP_NATIVE_EXECUTOR` | `scripts/lib/*process*`, `contabilidade-docker.psm1` | um owner durante P0 |
| `STARTUP_PROBE_LIFECYCLE` | sequential startup/probe/tests | owner emergencial atual |
| `STARTUP_INTEGRATION_HARNESS` | testes Docker/Compose/evidência | serial após ou junto ao fix, sem overlap de produção |
| `REQUIRED_CI_GATE` | `.github/workflows/required-ci.yml`, `scripts/ci/**` | suspenso durante P0 |
| `DEPENDENCY_LOCKS` | POM/package/lockfiles | owner explícito |
| `ARCHITECTURE_BASELINE` | baseline/allowlist | nenhum owner ativo |

## Owner ativo P0

| ITEM | Owner | Escrita permitida |
|---|---|---|
| `FIX-STARTUP-PROBE-001` | `STARTUP_PROBE_LIFECYCLE` | sequential startup, executor Docker estritamente necessário, testes e resultado |
| `STR-STARTUP-TEST-001` | `STARTUP_INTEGRATION_HARNESS` | harness/fixtures/evidência; produto, Compose base e dados reais read-only |

A execução já iniciada pelo usuário na branch `codex/fix-startup-issue-in-main-workflow` ocupa o owner
de startup. Nenhuma segunda task pode alterar os mesmos arquivos até reconciliação ou supersession.

## Wave 012

`CONTABILIDADE_FAST_LANE_WAVE_012` está superseded pelo hold P0.

| ITEM | Estado |
|---|---|
| `VAL-W011-FULLSTACK-012` | resultado integrado; nenhuma escrita adicional autorizada |
| `STR-INF-002` | retornado ao backlog |
| `STR-INF-003` | retornado ao backlog |
| `STR-CI-003` | retornado ao backlog |
| `STR-OBS-003` | retornado ao backlog |

## Regras de independência

- documentação canônica permanece com o orquestrador;
- somente um owner toca startup/executor nativo;
- harness pode adicionar testes, mas não corrigir produto em paralelo;
- nenhuma migration ou dependency manifest pertence ao P0;
- nenhum provider, credencial, certificado, backup ou dado real;
- overlap torna o owner posterior `SUPERSEDED`;
- nova wave é negada até `VAL-WINDOWS-COMPOSE-STARTUP-001 = PASS`.

## Campanhas reservadas

- primeiro e segundo startup Windows;
- on-premise/Keycloak após dev verde;
- backend/Testcontainers;
- Required CI remoto/branch protection;
- restore e promoção reais.

`OWNER_MATRIX_P0_STARTUP_RELIABILITY_HOLD`
