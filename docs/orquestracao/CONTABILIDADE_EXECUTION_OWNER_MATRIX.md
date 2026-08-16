# Matriz de owners e hotspots

**Classificação:** `CANONICAL_ACTIVE_OWNER_MATRIX`

## Regra

Um owner aberto/reservado bloqueia trabalho paralelo nos mesmos arquivos ou autoridade. Arquivos
diferentes ainda podem conflitar quando compartilham contrato, migration frontier, versão ou
workflow.

## Hotspots serializados

| Owner | Paths/autoridade | Regra |
|---|---|---|
| `ROOT_GOVERNANCE` | `AGENTS.md`, índice, governança | um owner por vez |
| `ORCHESTRATION_STATE` | current state, waves, board, config | orquestrador somente |
| `ROADMAP_REGISTRY` | registros/backlogs globais | reconciliação serial |
| `TEST_LEDGER` | master ledger, campanhas, evidência reuse | validação/reconciliação serial |
| `MIGRATION_LANE` | `backend/src/main/resources/db/migration/**` | máximo um owner por onda |
| `PERMISSION_AUTHORITY` | catálogo/permissões/backend auth | owner único |
| `FRONTEND_SHELL` | app shell, routing, i18n comum, clients compartilhados | serializar overlap |
| `WORKER_RUNTIME` | polling, leases, retry, browser/session, shutdown | serializar contratos |
| `STARTUP_DEPLOY` | Compose, startup, deploy, Docker workflows | serializar |
| `VERSION_RELEASE` | `VERSION`, manifests, package/pom versions, changelog | owner único |
| `DEPENDENCY_LOCKS` | `pom.xml`, package manifests/lockfiles | owner explícito |
| `DOCUMENT_STORAGE` | storage abstraction, download/preview/integrity | owner único por fluxo |

## PR aberta no checkpoint

PR `#56` reserva atualmente:

```text
.env.example
.github/workflows/build.yml
DEPLOY_CONTABILIDADE_ONPREMISE.bat
INSTRUCOES_START_CONTABILIDADE.md
README.md
START_CONTABILIDADE.bat
docs/operacao/BUILD_DOCKER_RESILIENTE_E_DEPLOY_PRODUCAO.md
scripts/codex/validate-docker-orchestration.mjs
scripts/maintenance/**
scripts/start-compose-sequential.*
scripts/start-contabilidade-core.bat
scripts/start-contabilidade-resilient.ps1
scripts/validate-database-state.bat
```

A lista acima é snapshot e deve ser confirmada no GitHub antes de liberar nova task.

## Regras de wave

- owners oficiais e extras contam para o mesmo máximo de cinco;
- no máximo um owner de migration;
- sem dependência dentro da onda;
- baseline idêntico;
- arquivos compartilhados ficam fora de slots paralelos, salvo owner consolidado explícito;
- conflito descoberto depois da preparação torna o candidato `SUPERSEDED` ou o serializa.
