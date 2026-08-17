# Matriz de owners e hotspots

**Classificação:** `CANONICAL_ACTIVE_OWNER_MATRIX`

## Hotspots serializados

| Owner | Paths/autoridade | Regra |
|---|---|---|
| `ROOT_GOVERNANCE` | AGENTS, índices, locks | orquestrador/documentação direta |
| `ORCHESTRATION_STATE` | checkpoint, ledger, backlog, manifests | orquestrador somente |
| `MIGRATION_LANE` | `backend/src/main/resources/db/migration/**` | máximo um owner |
| `REQUIRED_CI_GATE` | `.github/workflows/required-ci.yml`, `scripts/ci/**` | um owner por onda |
| `DEPENDENCY_LOCKS` | POM/package/lockfiles | owner explícito |
| `STARTUP_DEPLOY` | Compose/startup/deploy | serial |
| `ARCHITECTURE_BASELINE` | `scripts/architecture/baseline.json`, allowlist | um owner por onda |
| `TLS_POLICY` | `scripts/security/tls/**`, `infra/tls/**` | um owner por onda |
| `ONPREMISE_IAC` | `scripts/infrastructure/**`, `infra/iac/**` | um owner por onda |
| `SYNTHETIC_MONITORING` | `scripts/observability/synthetic/**`, `infra/observability/synthetic/**` | um owner por onda |

## Fast Lane Wave 012

| ITEM | Owner exclusivo | Escrita permitida |
|---|---|---|
| `VAL-W011-FULLSTACK-012` | `FULLSTACK_POST_W011_VALIDATION` | somente resultado; produto read-only |
| `STR-INF-002` | `TLS_CERTIFICATE_LIFECYCLE_GUARD` | TLS policy/schema/fixtures/tests/workflow e resultado |
| `STR-INF-003` | `ONPREMISE_IAC_DRIFT_GUARD` | IaC inventory/plan/policy/fixtures/tests/workflow e resultado |
| `STR-CI-003` | `LOCAL_REQUIRED_CI_PARITY` | runner/ledger/testes sob `scripts/ci/**` e resultado; workflow required read-only |
| `STR-OBS-003` | `SYNTHETIC_READINESS_MONITORING` | probes/policy/fixtures/tests/workflow dedicado e resultado |

## Independência

- o smoke escreve somente seu relatório;
- TLS não toca chaves privadas, Compose, startup ou IaC;
- IaC apenas lê Compose/configurações e não provisiona host;
- CI local é o único owner de `scripts/ci/**` e não depende dos novos owners same-wave;
- monitoração sintética usa subtree própria e não altera métricas/alertas existentes;
- nenhum owner cria migration ou altera dependency manifest;
- nenhum owner usa provider, credencial, certificado privado, backup ou dado real;
- overlap descoberto torna o owner posterior `SUPERSEDED` ou serializado.

## Campanhas reservadas fora da wave

- Windows dev/segundo startup;
- on-premise/Keycloak;
- Testcontainers;
- restore real;
- promoção/rollback real;
- settings do GitHub Actions e branch protection.

`OWNER_MATRIX_FAST_LANE_WAVE_012`
