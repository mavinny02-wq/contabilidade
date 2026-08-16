# Matriz de owners e hotspots

**Classificação:** `CANONICAL_ACTIVE_OWNER_MATRIX`  
**Reconciliado em:** `2026-08-16`  
**HEAD observado:** `91a42c8e96775f2cbe3c09481beed879d4fbab31`

## Regra

Um owner aberto/reservado bloqueia trabalho paralelo nos mesmos arquivos ou autoridade. Arquivos
diferentes também conflitam quando compartilham migration frontier, versão, workflow ou contrato.

## Hotspots serializados

| Owner | Paths/autoridade | Regra |
|---|---|---|
| `ROOT_GOVERNANCE` | `AGENTS.md`, índice, governança | um owner por vez |
| `ORCHESTRATION_STATE` | current state, waves, board, config | orquestrador somente |
| `ROADMAP_REGISTRY` | registros/backlogs globais | reconciliação serial |
| `TEST_LEDGER` | master ledger, campanhas, evidence reuse | reconciliação serial |
| `MIGRATION_LANE` | migrations e registry | máximo um owner por wave |
| `PERMISSION_AUTHORITY` | catálogo/permissões/backend auth | owner único |
| `FRONTEND_SHELL` | routing, i18n comum, clients compartilhados | serializar overlap |
| `WORKER_RUNTIME` | polling, leases, browser/session, shutdown | serializar contratos |
| `STARTUP_DEPLOY` | Compose, startup, deploy e build workflow | serializar |
| `WINDOWS_EVIDENCE` | coletor, schema e fixtures Windows | separado de startup |
| `WAVE_MANIFESTS` | manifests e validators de lifecycle | owner único |
| `VERSION_RELEASE` | versão, manifests, imagens e release guard | owner único |
| `DEPENDENCY_LOCKS` | POM/package/lockfiles | owner explícito |
| `CODEOWNERS_HOTSPOTS` | `.github/CODEOWNERS` | identidades reais somente |
| `DOCUMENT_STORAGE` | storage/download/preview/integrity | owner único por fluxo |

## PRs abertas

### PR `#56`

Estado: `CONFLICTING / SUPERSESSION_REQUIRED`.

Reserva histórica os arquivos de `STARTUP_DEPLOY`, mas não deve ser mergeada sobre a main atual.
Antes da release da Wave 003, ela deve ser encerrada como superseded; seu successor é
`FIX-STARTUP-MAIN-001`.

### PR `#57`

Estado: `MERGEABLE / ROOT_GOVERNANCE + ORCHESTRATION_STATE`.

Enquanto não integrada, bloqueia alterações paralelas na fundação de governança, current state,
ledger, backlog e manifestos canônicos.

## Wave 003 preparada

| ITEM | Owner | Paths principais | Conflito conhecido |
|---|---|---|---|
| `FIX-STARTUP-MAIN-001` | `STARTUP_DEPLOY` | startup/Compose/build workflow | PR `#56`; resolver antes da release |
| `BUG-RUN-001` | `WINDOWS_EVIDENCE` | windows collector/schema/tests | nenhum |
| `STR-ORQ-003` | `WAVE_MANIFESTS` | wave manifests/validator/workflow próprio | PR `#57`; integrar antes |
| `STR-REL-001` | `VERSION_RELEASE` | guard/version workflow próprio | nenhum |
| `STR-OWN-001` | `CODEOWNERS_HOTSPOTS` | `.github/CODEOWNERS` | branch protection é ação posterior |

## Regras de wave

- owners oficiais e extras contam no mesmo máximo de cinco;
- no máximo um owner de migration;
- sem dependência dentro da wave;
- baseline idêntico;
- arquivos compartilhados ficam fora de slots paralelos;
- current state, ledger e backlog são atualizados pelo orquestrador depois dos merges;
- conflito descoberto depois da preparação bloqueia release ou torna o candidato `SUPERSEDED`.

`CONTABILIDADE_OWNER_MATRIX_WAVE_003_PREPARED`
