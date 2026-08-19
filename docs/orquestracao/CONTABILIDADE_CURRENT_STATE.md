# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`  
**Reconciliado em:** `2026-08-19`  
**Branch:** `main`  
**HEAD funcional:** `1daf53fc2d144375f624ca5d1c5e890be9d0a756`  
**Versão:** `0.5.1`  
**Flyway:** `V12`  
**Modo:** `STARTUP_FIX_INTEGRATED_WINDOWS_RUNTIME_PENDING`

## Verdade atual

A PR `#137` integrou a correção estrutural do lifecycle do startup probe:

- executor Docker central com stdout/stderr/exit code estruturados;
- probe ausente e remoção concorrente idempotentes;
- ownership por label e remoção por container ID;
- verificação explícita das imagens runtime;
- Pester, integração Docker/Compose e runner de evidência adicionados.

A integração estrutural não comprova que a aplicação sobe no Windows do usuário. O gate continua
aberto até o mesmo SHA passar no Windows PowerShell 5.1 + Docker Desktop.

## Evidência válida

```text
CORE_APPLICATION_LINUX_CONTROLLED = GREEN_REUSABLE
BACKEND_POSTGRESQL = GREEN_REUSABLE
FRONTEND_NODE24 = GREEN_REUSABLE
WORKER_NODE24_PLAYWRIGHT = GREEN_REUSABLE
FLYWAY_V1_V12 = GREEN_REUSABLE
STARTUP_PROBE_FIX = INTEGRATED_STRUCTURAL
WINDOWS_DEV_STACK = NOT_PROVEN_AFTER_FIX
WINDOWS_SECOND_START_REUSE = NOT_PROVEN
ONPREMISE_KEYCLOAK = BLOCKED_UNTIL_DEV_GREEN
```

## Gate P0

Executar, no checkout limpo do HEAD integrado:

```text
scripts/tests/run-startup-reliability-gate.ps1
  -RunDockerIntegration
  -RunComposeIntegration
  -RunOfficialStartup
```

Aceite:

- Pester zero falhas no PowerShell 5.1;
- lifecycle Docker real verde;
- Compose efêmero passa duas vezes;
- `START_CONTABILIDADE.bat dev` passa duas vezes;
- PostgreSQL e marker sintético preservados;
- backend/worker/frontend saudáveis;
- probe ausente ao final;
- JSON/Markdown redigidos pinados ao SHA.

## Governança de contexto

A paridade PRIMA de `AGENTS.md`, orçamento e safeguards está sendo integrada como documentação/tooling
independente. Ela não altera produto nem fecha o gate runtime. O guard canônico é
`scripts/ai/context_governance_guard.py`; o profiler separa uso reportado de estimativa local.

## Seleção

```text
NORMAL_WAVE_SELECTION = DENIED
P0_RUNTIME_VALIDATION = REQUIRED
MIGRATION_OWNER = NONE
REAL_EXTERNAL_PROVIDERS = NOT_AUTHORIZED
```

Itens TLS, IaC, CI local e monitoração sintética permanecem no backlog até o startup Windows ficar
verde. Não liberar nova wave funcional antes dessa evidência.

`CONTABILIDADE_CURRENT_STATE_STARTUP_FIX_INTEGRATED_RUNTIME_PENDING`
