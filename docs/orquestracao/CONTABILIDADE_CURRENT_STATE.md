# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`  
**Reconciliado em:** `2026-08-19`  
**Branch:** `main`  
**Baseline analisada:** `ff599c8f6d0657d6545ff7712ca70e891d80e394`  
**Versão:** `0.5.1`  
**Flyway:** `V12`  
**Modo:** `STARTUP_ACTIONS_IMPLEMENTED_WINDOWS_RUNTIME_PENDING`

## Verdade atual

- PR `#137`: executor Docker/probe lifecycle e harness de confiabilidade integrados;
- PR `#138`: agents, HOT/WARM/COLD, budgets e token safeguards PRIMA integrados;
- startup local agora possui contratos separados para diagnóstico, compilação, build de imagens e
  início da stack;
- nenhuma dessas integrações comprova ainda que o HEAD sobe no Windows do usuário.

## Ações oficiais

```text
START_CONTABILIDADE.bat doctor
  read-only: parser, toolchain, Docker, Compose, override e imagens

START_CONTABILIDADE.bat check
  compile/typecheck/build; não inicia ou altera Compose

START_CONTABILIDADE.bat build
  compila e cria/verifica imagens; não inicia Compose

START_CONTABILIDADE.bat start
  inicia imagens existentes; não executa Maven/npm/compilação

START_CONTABILIDADE.bat dev
  compatibilidade: build + start
```

Assim, uma falha em `check`/`build` é produto ou toolchain; uma falha em `start` é
Docker/Compose/readiness/runtime. O arquivo e a linha de uma falha de compilação só podem ser
classificados pelo log Maven/TypeScript atual.

## Evidência reutilizável

```text
CORE_APPLICATION_LINUX_CONTROLLED = GREEN_REUSABLE
BACKEND_POSTGRESQL = GREEN_REUSABLE
FRONTEND_NODE24 = GREEN_REUSABLE
WORKER_NODE24_PLAYWRIGHT = GREEN_REUSABLE
FLYWAY_V1_V12 = GREEN_REUSABLE
STARTUP_PROBE_FIX = INTEGRATED_STRUCTURAL
CONTEXT_GOVERNANCE_PRIMA = INTEGRATED
STARTUP_ACTION_SEPARATION = IMPLEMENTED_STRUCTURAL
WINDOWS_DEV_STACK = NOT_PROVEN_AFTER_FIX
WINDOWS_SECOND_START_REUSE = NOT_PROVEN
ONPREMISE_KEYCLOAK = BLOCKED_UNTIL_DEV_GREEN
```

## Gate P0

No checkout limpo do mesmo SHA:

```text
START_CONTABILIDADE.bat doctor
START_CONTABILIDADE.bat check
START_CONTABILIDADE.bat build
START_CONTABILIDADE.bat start
START_CONTABILIDADE.bat start
```

Também executar o runner integrado:

```text
scripts/tests/run-startup-reliability-gate.ps1
  -RunDockerIntegration
  -RunComposeIntegration
  -RunOfficialStartup
```

Aceite: PowerShell/Pester verdes, Docker lifecycle verde, PostgreSQL/marker preservados, backend,
worker e frontend saudáveis, probe ausente e evidência redigida pinada ao SHA.

## Seleção

```text
NORMAL_WAVE_SELECTION = DENIED
P0_RUNTIME_VALIDATION = REQUIRED
MIGRATION_OWNER = NONE
REAL_EXTERNAL_PROVIDERS = NOT_AUTHORIZED
```

TLS, IaC, CI local, monitoração sintética e on-premise/Keycloak continuam bloqueados até o startup
Windows e a segunda execução ficarem verdes.

`CONTABILIDADE_CURRENT_STATE_STARTUP_ACTIONS_RUNTIME_PENDING`
