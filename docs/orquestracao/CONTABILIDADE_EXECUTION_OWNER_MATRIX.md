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
| `STARTUP_PROBE_LIFECYCLE` | sequential startup/probe/tests | owner serial da Wave 013 |
| `STARTUP_INTEGRATION_HARNESS` | testes Docker/Compose/evidência | incorporado ao mesmo owner da Wave 013 |
| `REQUIRED_CI_GATE` | `.github/workflows/required-ci.yml`, `scripts/ci/**` | suspenso durante P0 |
| `DEPENDENCY_LOCKS` | POM/package/lockfiles | owner explícito |
| `ARCHITECTURE_BASELINE` | baseline/allowlist | nenhum owner ativo |

## Owner ativo P0

| ITEM | Owner | Escrita permitida |
|---|---|---|
| `FIX-STARTUP-PROBE-001` | `STARTUP_RECOVERY_SERIAL` | sequential startup, executor Docker, harness/fixtures/testes e resultado |

`STR-STARTUP-TEST-001` está incorporado ao owner acima e não constitui slot independente. A branch
antiga `codex/fix-startup-issue-in-main-workflow` foi integrada pela PR `#71`; não existe PR aberta
nem reserva anterior concorrente.

## Wave 013

`CONTABILIDADE_STARTUP_RECOVERY_WAVE_013` está liberada com um único owner serial. Ela é a exceção
P0 ao hold e não autoriza feature, migration, dependência ou segundo owner de startup.

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
- harness e correção pertencem à mesma task serial;
- nenhuma migration ou dependency manifest pertence ao P0;
- nenhum provider, credencial, certificado, backup ou dado real;
- overlap torna o owner posterior `SUPERSEDED`;
- nova wave funcional/estrutural comum é negada até
  `VAL-WINDOWS-COMPOSE-STARTUP-001 = PASS`.

## Campanhas reservadas

- primeiro e segundo startup Windows;
- on-premise/Keycloak após dev verde;
- backend/Testcontainers;
- Required CI remoto/branch protection;
- restore e promoção reais.

`OWNER_MATRIX_STARTUP_RECOVERY_WAVE_013_RELEASED`
