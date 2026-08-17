# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`
**Reconciliado em:** `2026-08-16`
**HEAD observado:** `357dd4b8827c0c9620d0dd7e8398bc3468418ff9`

Este ledger reutiliza prova válida e agenda somente owner explicitamente liberado.

## Evidência reutilizável

| ID | Owner | Resultado | Disposição |
|---|---|---|---|
| `VAL-W007-FULLSTACK-008` | aplicação controlada | Flyway V12, health, heartbeat, 19 jornadas, a11y, zero externa/5xx | `REUSE_PASS` |
| `STR-QA-BE-001` | backend critical suite | test-compile verde; runtime sem Docker | `RERUN_WHEN_DOCKER_AVAILABLE` |
| `STR-OBS-002` | SLO/alerting | 15 alertas, 7 SLOs, 4 fixtures e guard verde | `REUSE_PASS_STRUCTURAL` |
| `STR-ARCH-002` | worker composition | Node 24, 3 testes, 600 arestas e 6 findings | `REUSE_PASS` |
| `STR-CTX-002` | task budgets | schema/policy/testes e saídas byte-idênticas | `REUSE_PASS` |
| `STR-FE-001` | frontend a11y | 24 testes + 6 smokes Chromium/axe | `REUSE_PASS` |
| `STR-QA-WRK-002` | worker quality | 15 testes e coverage completo | `REUSE_PASS` |

## Prova backend pendente fora dos slots

`VAL-QA-BE-DOCKER-001` exige Java 21 e Docker:

```bash
cd backend
mvn -B -Dtest=ExecucaoFilaPostgresqlTest test
mvn -B -Dtest=ExecucaoFilaPostgresqlTest test
```

A ausência de Docker é `ENVIRONMENT_LIMITATION`; não autoriza mudança de produção nem repetição em
executor sabidamente incompatível.

## Fast Lane Wave 009

| ITEM | Prova | Disposição esperada |
|---|---|---|
| `VAL-W008-FULLSTACK-009` | HEAD pós-Wave 008, guards, PostgreSQL/Flyway, health, 19+ jornadas e a11y | `PASS` ou classificação exata |
| `STR-QA-FE-002` | Node 24, suíte e duas medições reproduzíveis de coverage frontend | `PASS_COMPLETE` |
| `STR-SEC-IAM-001` | papéis/permissões/rotas/realm alinhados por guard determinístico | `PASS` |
| `STR-ARCH-BE-003` | busca global desacoplada; findings 6 → 4 | `PASS` |
| `STR-DOC-002` | traversal, symlink, atomicidade, cleanup e concorrência do storage local | `PASS` |

## Políticas

- falha do smoke gera successor e não correção dentro da validação;
- coverage não reduz threshold/tolerância para obter verde;
- IAM mantém produção e realm read-only;
- architecture remove somente dois findings mapeados;
- storage usa apenas diretórios/bytes sintéticos;
- providers reais, dados reais e migrations estão fora da wave.

## Gates externos

```text
BACKEND_TESTCONTAINERS_RUNTIME = WAITING_FOR_DOCKER
REQUIRED_CI_REMOTE = NOT_PROVEN
BRANCH_PROTECTION = NOT_ENABLED
WINDOWS_DEV = NOT_PROVEN
WINDOWS_SECOND_START = NOT_PROVEN
ONPREMISE_KEYCLOAK = BLOCKED_UNTIL_WINDOWS_DEV_GREEN
REAL_EXTERNAL_PROVIDERS = NOT_AUTHORIZED
```

Classificações de falha:
`PRODUCT_REGRESSION`, `TEST_CONTRACT_DRIFT`, `DATA_OR_FIXTURE_DEFECT`,
`ENVIRONMENT_LIMITATION`, `BASELINE_DRIFT` e `PRODUCT_GOVERNANCE_DEFECT`.

`MASTER_TEST_ORCHESTRATION_FAST_LANE_WAVE_009_RELEASED`
