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
| `DISPATCH_GOVERNANCE` | manifest/launcher/dispatch registry | owner único por wave |

## Wave 004

| ITEM | Owner exclusivo | Escrita permitida |
|---|---|---|
| `BUG-ORQ-001` | `DISPATCH_GOVERNANCE` | manifest/launcher schema e validator, registry/preflight, testes, workflow |
| `STR-SEC-001` | `SECURITY_POLICY` | scanner/policy/fixtures/testes/workflow próprios |
| `STR-DEP-001` | `DEPENDENCY_INVENTORY` | SBOM/license/advisory scripts, policy, fixtures e workflow; manifests read-only |
| `STR-DB-001` | `BACKEND_TEST_DATABASE` | POM de teste, teste PostgreSQL/Testcontainers e workflow dedicado; SQL read-only |
| `STR-WRK-001` | `WORKER_RUNTIME` | seams bounded e testes do worker; provider flows excluídos |

## Regras

- todos partem do mesmo baseline observado;
- nenhum owner de migration;
- arquivos de checkpoint, ledger, backlog e wave ficam fora dos executores;
- workflows novos possuem nomes exclusivos e não alteram `build.yml`;
- `STR-DEP-001` não edita POM/package/lockfiles;
- `STR-DB-001` é o único owner de `backend/pom.xml`;
- `STR-WRK-001` é o único owner de runtime/testes do worker;
- overlap descoberto torna o owner posterior `SUPERSEDED` ou serializado.

`OWNER_MATRIX_WAVE_004`
