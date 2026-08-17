# FIX-BUILDX-STARTUP-001 — resultado

**ITEM:** `FIX-BUILDX-STARTUP-001`  
**Baseline:** `8c74acd40882579737f1dcc1ca74643beabfefec`  
**Status:** `PASS_WITH_ENVIRONMENT_LIMITATION`

## Causa raiz confirmada

`start-contabilidade-resilient.ps1` executava `docker buildx inspect` com `2>&1` enquanto mantinha
`$ErrorActionPreference = 'Stop'`. No Windows PowerShell 5.1, o stderr nativo do caso esperado
“builder inexistente” pode ser convertido em `NativeCommandError` antes da leitura de
`$LASTEXITCODE`, impedindo a criação automática.

## Resultado

- A execução nativa foi centralizada em uma função compatível com Windows PowerShell 5.1 e
  PowerShell 7 que captura stdout e stderr separadamente, restaura a preferência do chamador e
  sempre retorna exit code e indicador de sucesso.
- Docker CLI, daemon e plugin Buildx agora têm diagnósticos distintos e orientativos.
- A ausência inicial é confirmada por `buildx ls`, criada com o builder isolado
  `docker-container` e `default-load=true`, selecionada por `buildx use` e inicializada por
  `inspect --bootstrap`.
- Builder existente é reutilizado. Uma falha de inspect em builder ainda listado é classificada
  como quebrado/inacessível e não dispara remoção automática.
- O build local continua usando imagens carregadas no image store do daemon; falhas do build e do
  startup continuam sendo propagadas pelo fluxo resiliente existente.
- O modo dev e sua omissão de Keycloak não foram alterados.

## Owners alterados

- `scripts/start-contabilidade-resilient.ps1`;
- módulo e testes PowerShell de Docker/Buildx em `scripts/`;
- guard estrutural da orquestração Docker;
- este `RESULT_MD`.

Nenhuma migration, dependência, lockfile ou configuração global do Docker foi alterada.

## Cenários

| Cenário | Evidência | Resultado |
|---|---|---|
| Builder ausente | teste Pester com inspect 1, lista sem o nome, create/use/bootstrap | `IMPLEMENTED_NOT_EXECUTED_ENVIRONMENT_LIMITATION` |
| Builder existente | teste Pester confirma zero creates, use e bootstrap | `IMPLEMENTED_NOT_EXECUTED_ENVIRONMENT_LIMITATION` |
| Repetição/idempotência | caminho de builder existente não cria duplicata | `IMPLEMENTED_NOT_EXECUTED_ENVIRONMENT_LIMITATION` |
| Daemon parado | teste Pester exige mensagem de daemon antes de Buildx | `IMPLEMENTED_NOT_EXECUTED_ENVIRONMENT_LIMITATION` |
| Buildx ausente | teste Pester exige erro orientativo | `IMPLEMENTED_NOT_EXECUTED_ENVIRONMENT_LIMITATION` |
| Create falha | teste Pester preserva exit code 23 | `IMPLEMENTED_NOT_EXECUTED_ENVIRONMENT_LIMITATION` |
| Bootstrap falha | teste Pester preserva exit code 42 | `IMPLEMENTED_NOT_EXECUTED_ENVIRONMENT_LIMITATION` |
| Build/startup falha | propagação de exit code do core preservada | `PASS_STRUCTURAL` |
| Dev sem Keycloak | guard canônico passou e configuração existente foi preservada | `PASS_STRUCTURAL` |

## Validação

| Comando | Resultado |
|---|---|
| `node scripts/codex/validate-docker-orchestration.mjs` | `PASS` |
| `node --test scripts/codex/validate-docker-orchestration.test.mjs` | `PASS` — 2 testes |
| `pwsh -NoProfile -Command "Invoke-Pester ./scripts/tests/contabilidade-docker.Tests.ps1 -Output Detailed"` | `ENVIRONMENT_LIMITATION` — `pwsh` ausente |
| `docker buildx ls` | `ENVIRONMENT_LIMITATION` — Docker CLI ausente |
| `docker compose --env-file .env.example -f compose.yaml -f compose.dev.yaml ps` | `ENVIRONMENT_LIMITATION` — Docker CLI ausente |
| `git diff --check` | `PASS` |

## Limitações e provas pendentes

- Este executor Linux não fornece PowerShell, Docker CLI, daemon nem Docker Desktop. Portanto não
  alega runtime Windows, duas execuções reais, health checks, logs de containers, `buildx ls` ou
  `compose ps` reais.
- Os sete testes Pester com mocks foram adicionados, mas sua execução permanece pendente em agente
  Windows/PowerShell com Pester.
- A recuperação destrutiva já existente continua limitada à assinatura conhecida de corrupção de
  snapshot e somente ao builder nomeado do projeto; uma inspeção comum malsucedida não o remove.

## Commit e PR

- Commit de implementação: `6ac0d441fbe4c34a8f56c8e217a0f604f0e8509a`.
- PR: `NOT_CREATED_ENVIRONMENT_LIMITATION` — a ferramenta `make_pr` não está disponível neste
  executor, o checkout não possui remote configurado e o GitHub CLI não está autenticado.
