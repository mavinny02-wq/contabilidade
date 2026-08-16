# Matriz de owners e hotspots

**Classificação:** `CANONICAL_ACTIVE_OWNER_MATRIX`  
**Reconciliado em:** `2026-08-16`  
**Baseline de release:** `659ff87e4344cab235d87a443ea9ddb310fe03d5`

## Regra

Um owner aberto bloqueia trabalho paralelo nos mesmos arquivos ou autoridade. Arquivos diferentes
também conflitam quando compartilham migration frontier, versão, workflow ou contrato.

## Hotspots serializados

| Owner | Paths/autoridade | Regra |
|---|---|---|
| `ROOT_GOVERNANCE` | `AGENTS.md`, índice e governança | um owner por vez |
| `ORCHESTRATION_STATE` | current state, board, ledger e backlog | orquestrador somente |
| `MIGRATION_LANE` | migrations e registry | máximo um owner por wave |
| `FRONTEND_SHELL` | routing, i18n comum e clients | serializar overlap |
| `WORKER_RUNTIME` | polling, leases, browser/session e shutdown | serializar contratos |
| `STARTUP_DEPLOY` | Compose, startup, deploy e build workflow | serializar |
| `WINDOWS_EVIDENCE` | coletor, schema e fixtures Windows | separado de startup |
| `WAVE_MANIFESTS` | schema/validator/testes de lifecycle | owner único |
| `VERSION_RELEASE` | versão, imagens e release guard | owner único |
| `CODEOWNERS_HOTSPOTS` | `.github/CODEOWNERS` | identidades reais somente |
| `DEPENDENCY_LOCKS` | POM/package/lockfiles | owner explícito |
| `DOCUMENT_STORAGE` | storage/download/preview/integrity | owner único por fluxo |

## Gates resolvidos

- PR `#56`: encerrada sem merge como `SUPERSEDED`;
- PR `#57`: integrada;
- fila aberta verificada antes da liberação: vazia;
- migration owner: nenhum;
- Wave 003: cinco owners independentes.

## Wave 003 liberada

| ITEM | Owner | Paths principais |
|---|---|---|
| `FIX-STARTUP-MAIN-001` | `STARTUP_DEPLOY` | startup, Compose, docs associadas e build workflow |
| `BUG-RUN-001` | `WINDOWS_EVIDENCE` | collector, wrapper, schema, fixtures e testes Windows |
| `STR-ORQ-003` | `WAVE_MANIFESTS` | schema/validator/testes/fixtures e workflow dedicado |
| `STR-REL-001` | `VERSION_RELEASE` | guard/testes/fixtures de versão e workflow dedicado |
| `STR-OWN-001` | `CODEOWNERS_HOTSPOTS` | `.github/CODEOWNERS` e resultado |

`ORCHESTRATION_STATE`, `TEST_LEDGER` e `ROADMAP_REGISTRY` ficam fora dos executores e são
reconciliados serialmente pelo orquestrador.

## Regras da wave

- baseline idêntico;
- sem dependência same-wave;
- migration owner `NONE`;
- cada executor altera somente seu owner e RESULT_MD;
- nenhum slot altera current state, ledger ou backlog;
- conflito novo bloqueia integração até reconciliação.

`CONTABILIDADE_OWNER_MATRIX_WAVE_003_RELEASED`
