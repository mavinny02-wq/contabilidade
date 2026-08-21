# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`  
**Reconciliado em:** `2026-08-21`
**Branch:** `main`  
**Baseline integrada analisada:** `bb55cbb9f019914ca454871776f23d886a811b6b`
**Versão:** `0.5.1`  
**Flyway:** `V12`  
**Modo:** `STARTUP_ACTIONS_IMPLEMENTED_WINDOWS_RUNTIME_PENDING`

## Verdade atual

- PR `#137`: executor Docker/probe lifecycle e harness de confiabilidade integrados;
- PR `#138`: agents, HOT/WARM/COLD, budgets e token safeguards PRIMA integrados;
- startup local agora possui contratos separados para diagnóstico, compilação, build de imagens e
  início da stack;
- nenhuma dessas integrações comprova ainda que o HEAD sobe no Windows do usuário.

## Delta local aguardando integração

- `codex/bootstrap-deepseek-runner` possui roteamento LLM externo opcional estruturalmente verde,
  mantendo Codex inalterado sem chave;
- o preflight PowerShell voltou a parsear os 37 scripts após correção limitada no verificador de
  backup;
- o required gate de segredo/PII está verde localmente após substituir CPF literal de fixture por
  montagem `PUBLIC_SYNTHETIC` em runtime, sem exceção ou enfraquecimento do scanner;
- o scorecard reproduzível do worker cobre as duas amostras Flash observadas; custo permanece
  indisponível e nenhuma comparação OpenAI foi inferida sem amostra equivalente;
- DeepSeek Pro está fail-closed no runner local: motivo fechado e autoridade temporária são
  obrigatórios antes da rota, enquanto implementação comum permanece em Flash;
- essas evidências são locais e não substituem integração em `main` nem o gate Windows P0.

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
OPTIONAL_LLM_WORKER_ROUTING = LOCAL_BRANCH_STRUCTURAL_GREEN
SECRET_PII_REQUIRED_CI = LOCAL_BRANCH_GREEN
WORKER_EVAL_SCORECARD = LOCAL_BRANCH_GREEN
DEEPSEEK_PRO_FAIL_CLOSED = LOCAL_BRANCH_GREEN
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

Nenhuma wave normal foi aberta para a correção de fixture: ela recupera um required gate no branch
local e não altera a Wave 013 nem suspende o `P0_STARTUP_RELIABILITY_HOLD`.

`CONTABILIDADE_CURRENT_STATE_STARTUP_ACTIONS_RUNTIME_PENDING`
