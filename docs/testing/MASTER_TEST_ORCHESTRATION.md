# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`
**Reconciliado em:** `2026-08-16`
**HEAD observado:** `76258506f63777a228980b030857db1cefd89a43`

Este ledger reutiliza prova válida e agenda somente owner explicitamente liberado.

## Evidência reutilizável

| ID | Owner | Ambiente | Resultado | Disposição |
|---|---|---|---|---|
| `VAL-STAB-FULLSTACK-001` | aplicação controlada | Linux/PostgreSQL/Chromium | saúde, Flyway V12, heartbeat, 19 jornadas, zero externa/5xx | `REUSE_PASS` |
| `VAL-STAB-BACKEND-PG-002` | backend + PostgreSQL | Linux/PostgreSQL 16.14 | 5 testes, 0 falhas/erros | `REUSE_PASS` |
| `VAL-STAB-FRONTEND-NODE24-002` | frontend | Node 24.19 | i18n, typecheck, 20 testes e build | `REUSE_PASS` |
| `VAL-STAB-WORKER-NODE24-PW-002` | worker/browser | Node 24.19/Chromium | typecheck, 7 testes e build | `REUSE_PASS` |
| `STR-ORQ-002` | migrations | Node/Linux | registry V1–V12, checksum, ordem e retrocesso | `DONE` |
| `FIX-STARTUP-MAIN-001` | startup estático | Node/Linux | guard e regressões verdes; runtime Windows ausente | `PASS_WITH_ENVIRONMENT_LIMITATION` |
| `BUG-RUN-001` | coletor Windows | PowerShell/mocks | parser, schema, redaction e 9 testes | `IMPLEMENTED_AWAITING_LOCAL_WINDOWS_MANUAL` |
| `STR-ORQ-003` | lifecycle de waves | Python/Linux | validator e 6 testes verdes | `DONE` |
| `STR-REL-001` | versão/release | Python/Linux | versão 0.5.1 consistente e 6 testes de drift | `DONE` |
| `STR-OWN-001` | ownership | GitHub/estrutural | CODEOWNERS e identidade confirmada | `DONE_EXTERNAL_ENFORCEMENT_PENDING` |

Mudança exclusivamente documental não invalida aplicação. Mudança em startup exige prova Windows
focada, não rerun automático de backend/frontend/worker.

## Defeito de governança observado

As PRs `#73` e `#74` vieram do mesmo owner `STR-ORQ-003`. A duplicata foi encerrada como
`SUPERSEDED_DUPLICATE_OWNER`. O successor `BUG-ORQ-001` deve impedir repetição antes de dispatch ou
merge.

## Owners atuais

| Owner | Estado | Próxima prova |
|---|---|---|
| aplicação/backend/frontend | `GREEN_REUSABLE` | rerun após delta material |
| worker atual | `GREEN_REUSABLE` | Wave 004 amplia regressões sem repetir browser E2E amplo |
| Flyway V1–V12 | `GREEN_REUSABLE` | novo frontier ou lane Testcontainers |
| startup Windows dev | `NOT_PROVEN` | campanha manual com coletor v2 |
| segundo startup/reuso PostgreSQL | `NOT_PROVEN` | campanha manual |
| on-premise/Keycloak | `BLOCKED_UNTIL_DEV_GREEN` | campanha posterior |
| coverage agregado | `NOT_MEASURED` | `STR-QA-001` futuro |
| providers reais | `NOT_AUTHORIZED_NOT_REQUIRED` | não executar |

## Wave 003

`CONTABILIDADE_STABILIZATION_WAVE_003` está `CONSUMED`. Seus owners não podem ser relançados sem
novo item/baseline e motivo de invalidação.

## Wave 004

`CONTABILIDADE_MATURITY_WAVE_004` está `RELEASED_FOR_EXECUTION`.

Ela contém cinco owners estruturais independentes:

- idempotência de dispatch;
- segredo/PII;
- dependências/SBOM/licenças;
- PostgreSQL Testcontainers;
- confiabilidade do worker.

## Política de falha

Classifique antes de corrigir:

- `PRODUCT_REGRESSION`;
- `TEST_CONTRACT_DRIFT`;
- `DATA_OR_FIXTURE_DEFECT`;
- `ENVIRONMENT_LIMITATION`;
- `BASELINE_DRIFT`;
- `PRODUCT_GOVERNANCE_DEFECT`.

`MASTER_TEST_ORCHESTRATION_WAVE_004_RELEASED`
