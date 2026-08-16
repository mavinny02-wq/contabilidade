# FIX-STARTUP-MAIN-001 — resultado

**ITEM:** `FIX-STARTUP-MAIN-001`
**Baseline:** `main@1288ed9a5f081fec03f5d869db7c622f4cd38f81`
**Status:** `PASS_WITH_ENVIRONMENT_LIMITATION`

## Resultado

- `START_CONTABILIDADE.bat` passou a ser o único BAT operacional na raiz e roteia desenvolvimento,
  deploy on-premise e manutenção manual de memória.
- O modo `dev` compila artefatos locais, reutiliza PostgreSQL saudável, remove somente os containers
  de autenticação desnecessários, recria os serviços da aplicação e aguarda readiness/health sem
  executar `docker compose down`.
- O modo `onpremise` continua usando imagens pré-construídas e inicia PostgreSQL, bootstrap,
  Keycloak, backend, worker e frontend sequencialmente, sem Maven, npm ou Docker build no servidor.
- O guard Docker cobre o novo roteamento, a separação dos modos, a ausência de limpeza destrutiva e
  mantém `containsDockerBuildCommand`, incluindo suas regressões contra falso positivo.
- O workflow preserva integralmente o job `migration-governance` e ganhou regressões Docker e parser
  PowerShell para os scripts operacionais tocados.

## Owners alterados

- startup e wrappers Batch/PowerShell;
- orquestração Compose sequencial e validação do banco por modo;
- manutenção Docker movida para `scripts/maintenance/`;
- guard Docker e build workflow;
- configuração de ambiente, ignore e documentação operacional associada.

Nenhuma migration, dependência ou lockfile foi alterado.

## Locks preservados

- `LOCK-DEP-001`: o fluxo on-premise usa imagens publicadas e permanece cloud-compatible.
- `LOCK-ENV-001`: não há alegação de prova Windows ou Docker Desktop neste executor Cloud.
- `LOCK-TEST-001`: ausências de `pwsh` e Docker foram classificadas como
  `ENVIRONMENT_LIMITATION`, sem mudança de produção para mascará-las.
- `LOCK-EVID-001`: a validação foi focada nos contratos alterados; evidências integradas de
  backend, frontend e worker não foram repetidas.

## Validação

| Comando | Resultado |
|---|---|
| `node scripts/codex/validate-docker-orchestration.mjs` | `PASS` |
| `node --test scripts/codex/validate-docker-orchestration.test.mjs` | `PASS` — 2 testes |
| `pwsh -NoProfile -Command '<Parser.ParseFile dos três scripts operacionais>'` | `ENVIRONMENT_LIMITATION` — `pwsh` ausente, exit 127 |
| `docker compose --env-file .env.example -f compose.yaml -f compose.dev.yaml config` | `ENVIRONMENT_LIMITATION` — Docker CLI ausente, exit 127 |
| `docker compose --env-file .env.example -f compose.yaml -f compose.onpremise.yaml config` | `ENVIRONMENT_LIMITATION` — Docker CLI ausente, exit 127 |
| `git diff --check` | `PASS` |

## Limitações e provas pendentes

- A sintaxe PowerShell permanece coberta pelo workflow, mas não pôde ser analisada localmente porque
  este ambiente não fornece `pwsh`.
- As duas configurações Compose permanecem pendentes de execução em ambiente com Docker CLI.
- Runtime por duplo clique, Docker Desktop, readiness real e preservação de volumes no Windows não
  foram provados neste executor Cloud.
- A PR `#56` deve ser encerrada como `SUPERSEDED` somente após a abertura da PR sucessora.

## Commit e PR

- Commit de implementação: `f9f3045`.
- PR: `NOT_CREATED_ENVIRONMENT_LIMITATION` — o ambiente não disponibilizou a ferramenta `make_pr`
  e o push HTTPS não possui credencial GitHub; a PR `#56` não deve ser mergeada.
