# FIX-NATIVE-STDERR-001 — resultado

**ITEM:** `FIX-NATIVE-STDERR-001`
**Baseline:** `main@cc460bf893f82c51fb79990dae2b8f1933f9c1c4`
**Status:** `PASS_WITH_ENVIRONMENT_LIMITATION`

## Resultado

- O build resiliente deixou de canalizar `cmd.exe` com `2>&1` sob
  `$ErrorActionPreference = 'Stop'`. A tentativa agora usa um executor baseado em
  `System.Diagnostics.Process` e decide sucesso exclusivamente pelo exit code capturado do processo.
- `stdout` e `stderr` são drenados concorrentemente com `ReadLineAsync`, exibidos durante a execução,
  gravados no log UTF-8 da tentativa e devolvidos separadamente e em uma visão combinada.
- O contrato de retry e a recuperação restrita à corrupção conhecida do builder foram preservados.
  Uma tentativa com exit code não zero é identificada no console antes da classificação da falha.
- A chamada CMD usa `/d /s /c` com uma única camada externa de aspas; as aspas internas do comando,
  caminhos e operadores CMD permanecem sob interpretação do próprio `cmd.exe`.

## Owners alterados

- executor do startup resiliente em `scripts/start-contabilidade-resilient.ps1`;
- módulo reutilizável `scripts/lib/native-process.psm1`;
- cobertura Pester do executor em `scripts/tests/native-process.Tests.ps1`.

Nenhuma migration, dependência, lockfile, configuração Compose ou regra de autenticação foi alterada.

## Locks e invariantes preservados

- A recuperação continua removendo somente o builder isolado da aplicação.
- O modo `dev` continua delegado ao startup sequencial existente, que omite Keycloak e mantém
  `APP_SECURITY_ENABLED=false`; este executor Linux não alega prova de runtime Windows/Docker Desktop.
- `stderr` não é descartado nem interpretado semanticamente e falhas reais continuam propagando o
  exit code do processo correspondente.

## Validação

| Comando | Resultado |
|---|---|
| `node scripts/codex/validate-docker-orchestration.mjs` | `PASS` — contratos de builder, startup incremental e modo dev sem Keycloak preservados |
| `node --test scripts/codex/validate-docker-orchestration.test.mjs` | `PASS` — 2 testes |
| `Invoke-Pester scripts/tests/native-process.Tests.ps1` | `ENVIRONMENT_LIMITATION` — PowerShell não está instalado neste executor Linux |
| `pwsh -NoProfile -File scripts/start-contabilidade-resilient.ps1 -Mode dev` | `ENVIRONMENT_LIMITATION` — não há PowerShell, `cmd.exe` ou Docker Desktop neste executor Linux |
| `docker compose ps` | `ENVIRONMENT_LIMITATION` — Docker CLI não está instalado neste executor Linux |
| `git diff --check` | `PASS` |

## Cenários cobertos pelo teste Windows/Pester

O teste automatizado cobre stdout com zero, stderr legítimo com zero, streams simultâneos, falhas
com códigos 1 e 7, duas mil linhas em cada stream, executável inexistente e script/argumento em
caminho com espaços. A execução desse conjunto e a prova de `java -version`, build integral,
health checks e `docker compose ps` permanecem pendentes em Windows com Docker Desktop.

## Limitações e provas pendentes

- Não foi possível produzir honestamente trecho de log do Java seguido do build, resultado do build
  completo, estado dos containers ou health checks: o ambiente disponível é Linux e não contém
  PowerShell, CMD nem Docker.
- Compatibilidade Windows PowerShell 5.1 e PowerShell 7 foi preservada por APIs .NET disponíveis em
  ambos, sem uso de `$PSNativeCommandUseErrorActionPreference`; a execução real nas duas versões
  permanece prova pendente.
- O Keycloak não foi iniciado neste executor. A ausência dele em uma execução dev real permanece
  pendente de validação Windows, embora o guard estrutural aplicável tenha passado.

## Commit e PR

- Commit de implementação: registrado no handoff final após o commit.
- PR: pendente da ferramenta de criação de PR no ambiente de execução.
