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
| `ARCHITECTURE_BASELINE` | `scripts/architecture/baseline.json`, allowlist | um owner por onda |
| `RELEASE_PROMOTION` | manifests/policy de promoção | um owner por onda |
| `RECOVERY_PLANNING` | schema/plano de recovery | um owner por onda |

## Fast Lane Wave 011

| ITEM | Owner exclusivo | Escrita permitida |
|---|---|---|
| `FIX-TECH-AUTH-001` | `TECHNICAL_AUTHORIZATION_ERROR_MAPPING` | global error mapping, mensagem, testes focados e resultado |
| `STR-ARCH-BE-005` | `DOCUMENTO_EMPRESA_QUERY_BOUNDARY` | porta Documento, adapter Empresa, testes e baseline/allowlist |
| `STR-SEC-003` | `SECRET_LIFECYCLE_GUARD` | `scripts/security/secret-lifecycle/**`, workflow e resultado |
| `STR-REL-003` | `IMMUTABLE_RELEASE_PROMOTION_GUARD` | `scripts/release/promotion/**`, workflow e resultado |
| `STR-OPS-002` | `RECOVERY_REHEARSAL_HARNESS` | `scripts/recovery/**`, workflow e resultado |

## Independência

- auth mapping não toca Documento, architecture, release, recovery ou secrets;
- architecture é o único owner do baseline/allowlist;
- secret lifecycle apenas lê configurações e não toca valores;
- release não toca registry, Compose ou runtime;
- recovery não toca scripts de backup nem dados;
- cada tooling owner usa diretório e workflow dedicados;
- nenhum owner cria migration ou altera dependency manifest;
- nenhum owner usa provider, credencial, backup ou dado real;
- overlap descoberto torna o owner posterior `SUPERSEDED` ou serializado.

## Campanhas reservadas fora da wave

- Windows dev/segundo startup;
- on-premise/Keycloak;
- Testcontainers;
- restore real;
- promoção/rollback real;
- settings do GitHub Actions e branch protection.

`OWNER_MATRIX_FAST_LANE_WAVE_011`
