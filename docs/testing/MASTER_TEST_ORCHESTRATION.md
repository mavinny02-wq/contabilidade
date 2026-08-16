# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`  
**Reconciliado em:** `2026-08-16`  
**HEAD observado:** `c3c06e8cb5921f96ecdb9b1e397594d01dd4430f`

Este ledger reutiliza prova válida e agenda somente owner explicitamente liberado.

## Evidência reutilizável

| ID | Owner | Ambiente | Resultado | Disposição |
|---|---|---|---|---|
| `VAL-STAB-FULLSTACK-001` | aplicação controlada | Linux/PostgreSQL/Chromium | saúde, Flyway V12, heartbeat, 19 jornadas, zero externa/5xx | `REUSE_PASS` |
| `VAL-STAB-BACKEND-PG-002` | backend produto | Linux/PostgreSQL 16.14 | 5 testes, 0 falhas/erros | `REUSE_PASS` |
| `VAL-STAB-FRONTEND-NODE24-002` | frontend | Node 24.19 | i18n, typecheck, 20 testes e build | `REUSE_PASS` |
| `VAL-STAB-WORKER-NODE24-PW-002` | worker antes do delta de confiabilidade | Node 24.19/Chromium | typecheck, 7 testes e build | `SUPERSEDED_BY_FOCUSED_DELTA` |
| `STR-ORQ-002` | migrations | Node/Linux | registry V1–V12, checksum, ordem e retrocesso | `DONE` |
| `FIX-STARTUP-MAIN-001` | startup estático | Node/Linux | guard e regressões verdes; runtime Windows ausente | `PASS_WITH_ENVIRONMENT_LIMITATION` |
| `BUG-RUN-001` | coletor Windows | PowerShell/mocks | parser, schema, redaction e 9 testes | `IMPLEMENTED_AWAITING_LOCAL_WINDOWS_MANUAL` |
| `STR-ORQ-003` | lifecycle de waves | Python/Linux | validator e 6 testes verdes | `DONE` |
| `STR-REL-001` | versão/release | Python/Linux | versão consistente e drift fixtures | `DONE` |
| `STR-OWN-001` | ownership | GitHub/estrutural | CODEOWNERS e identidade confirmada | `DONE_EXTERNAL_ENFORCEMENT_PENDING` |
| `BUG-ORQ-001` | dispatch | Python/Linux | manifest/launcher v2 e 19 testes | `DONE_GITHUB_AUDIT_PENDING` |
| `STR-SEC-001` | segredo/PII | Python/baseline rastreado | 0 findings, 3 testes sintéticos | `REUSE_PASS` |
| `STR-DEP-001` | SBOM/licenças | Maven/npm/Python | 104/226/49 componentes e 7 testes | `REUSE_PASS_NETWORK_ADVISORY_PENDING` |
| `STR-DB-001` | Testcontainers PostgreSQL 17 | Maven sem Docker | test-compile verde; runtime não executado | `RERUN_FOCUSED_IN_STR_CI_001` |
| `STR-WRK-001` | lease/retry/idempotência/shutdown | Node 24 sem Chromium | 4 focados verdes; suíte 10/11 | `RERUN_FOCUSED_IN_STR_CI_001` |

## Validade após a Wave 004

- O backend de produção não mudou; sua evidência PostgreSQL permanece válida.
- O novo teste Testcontainers precisa de Docker para provar PostgreSQL 17, Flyway e idempotência.
- O runtime do worker mudou; somente a suíte completa do worker/browser precisa ser repetida.
- Não repetir o full-stack amplo para fechar essas duas lacunas.
- Segurança e SBOM determinísticos permanecem reutilizáveis.
- Ausência de workflow/check observado não é aprovação de CI.

## Wave 004

`CONTABILIDADE_MATURITY_WAVE_004` está `CONSUMED`.

## Wave 005

`CONTABILIDADE_QUALITY_GATE_WAVE_005` está `RELEASED_FOR_EXECUTION`.

### Principais

| ITEM | Owner de prova | Resultado esperado |
|---|---|---|
| `STR-CI-001` | required gate | fan-in estável, backend Docker/Testcontainers e worker Chromium verdes |
| `STR-QA-001` | coverage | baseline real por componente e ratchet reproduzível |
| `STR-API-001` | contrato | OpenAPI determinístico e breaking-change guard |

### Extras

| ITEM | Owner de prova | Resultado esperado |
|---|---|---|
| `STR-DATA-001` | fixtures | somente dados sintéticos governados |
| `STR-PERF-001` | budgets | baseline e limite de crescimento de artefatos |

Extras contam no mesmo máximo de cinco; não existe sexto launcher.

## Required gate pretendido

O check final deve manter o nome estável:

```text
Required CI / required-ci
```

Ele deve falhar se qualquer lane determinística obrigatória falhar. Feed externo de advisory pode
permanecer em check separado; indisponibilidade de rede não vira `PASS`.

## Estado de prova

```text
BACKEND_PRODUCT: GREEN_REUSABLE
BACKEND_TESTCONTAINERS_17: RERUN_FOCUSED
FRONTEND: GREEN_REUSABLE
WORKER_RELIABILITY_FOCUSED: GREEN
WORKER_FULL_AFTER_DELTA: RERUN_FOCUSED
SECRET_PII: GREEN
SBOM_LICENSE: GREEN
ADVISORY_NETWORK: NOT_PROVEN
COVERAGE: NOT_MEASURED
OPENAPI_COMPATIBILITY: NOT_PROVEN
WINDOWS_DEV: NOT_PROVEN
```

## Política de falha

Classifique antes de corrigir:

- `PRODUCT_REGRESSION`;
- `TEST_CONTRACT_DRIFT`;
- `DATA_OR_FIXTURE_DEFECT`;
- `ENVIRONMENT_LIMITATION`;
- `BASELINE_DRIFT`;
- `PRODUCT_GOVERNANCE_DEFECT`.

`MASTER_TEST_ORCHESTRATION_WAVE_005_RELEASED`
