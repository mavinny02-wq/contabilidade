# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`
**Reconciliado em:** `2026-08-17`
**HEAD observado:** `3850443701279e2002c527b6eb376de8abd664cf`

Este ledger reutiliza prova válida, classifica falhas antes de corrigir e agenda somente owner
explicitamente liberado.

## Evidência reutilizável

| ID | Prova | Disposição |
|---|---|---|
| `FIX-TECH-AUTH-001` | 403 seguro, 401/500 preservados e 5 testes focados | `REUSE_PASS` |
| `STR-ARCH-BE-005` | 601 arestas, 0 findings e allowlist vazia | `REUSE_PASS_STRUCTURAL` |
| `STR-SEC-003` | lifecycle de segredos, 6 testes e saída byte-idêntica | `REUSE_PASS_STRUCTURAL` |
| `STR-REL-003` | promoção/rollback offline, 7 testes | `REUSE_PASS_STRUCTURAL` |
| `STR-OPS-002` | recovery planner, 8 testes e forbidden-command guard | `REUSE_PASS_STRUCTURAL` |
| `FIX-STARTUP-PREFLIGHT-001` | parse-first e guard Node; Windows pendente | `REUSE_PASS_STRUCTURAL_WITH_LIMITATION` |
| `VAL-W008-FULLSTACK-009` | PostgreSQL/Flyway/JPA, health, 19 jornadas, a11y, zero externa/5xx | `RERUN_FOCUSED_HEAD_CHANGED` |

## Motivo do smoke consolidado

A Wave 011 alterou:

- mapeamento HTTP de `AccessDeniedException`;
- composição Spring de `DocumentoService` por porta/adapter;
- baseline arquitetural para zero findings.

As provas focadas passaram. Um único smoke do HEAD valida startup, wiring documental, upload
sintético, guard arquitetural e ausência de regressão transversal. Não há autorização para corrigir
produto dentro da task de validação.

## Fast Lane Wave 012

| ITEM | Prova exigida | Disposição esperada |
|---|---|---|
| `VAL-W011-FULLSTACK-012` | builds, guards, PostgreSQL/Flyway, document upload, health, 19+ jornadas e a11y | `PASS` ou classificação exata |
| `STR-INF-002` | inventário TLS, SAN/expiração/algoritmo/source/exception e determinismo | `PASS_STRUCTURAL` |
| `STR-INF-003` | plano IaC on-premise, drift/host prerequisites e determinismo | `PASS_STRUCTURAL` |
| `STR-CI-003` | paridade de lanes, exit codes, resume e classificação ambiental | `PASS_STRUCTURAL` |
| `STR-OBS-003` | probes local-only, retry bounded, redaction e estados determinísticos | `PASS_STRUCTURAL` |

## Provas pendentes fora dos slots

### Backend/Testcontainers

```bash
cd backend
mvn -B -Dtest=ExecucaoFilaPostgresqlTest test
mvn -B -Dtest=ExecucaoFilaPostgresqlTest test
mvn -B -Dtest=BancoPostgresqlIntegracaoTest test
```

### Windows

```powershell
git switch main
git pull --ff-only
.\START_CONTABILIDADE.bat dev
```

Repetir para comprovar reuso e executar o coletor Windows v2.

## Políticas

- validação read-only não corrige produto;
- TLS tooling não lê nem grava chave privada;
- IaC tooling não executa comando privilegiado nem altera host;
- runner local nunca se apresenta como status remoto do GitHub;
- synthetic monitoring não chama provider nem usa dado real;
- falha de ambiente não vira `PASS`;
- nenhum provider real, dado real ou migration pertence à Wave 012.

## Gates externos

```text
BACKEND_TESTCONTAINERS_RUNTIME = WAITING_FOR_DOCKER
REQUIRED_CI_REMOTE = NOT_PROVEN
BRANCH_PROTECTION = NOT_ENABLED
WINDOWS_DEV = NOT_PROVEN_AFTER_LATEST_FIX
WINDOWS_SECOND_START = NOT_PROVEN
ONPREMISE_KEYCLOAK = BLOCKED_UNTIL_WINDOWS_DEV_GREEN
RESTORE_RUNTIME = WAITING_FOR_RUNTIME
PROMOTION_RUNTIME = WAITING_FOR_RUNTIME
REAL_EXTERNAL_PROVIDERS = NOT_AUTHORIZED
```

`MASTER_TEST_ORCHESTRATION_FAST_LANE_WAVE_012_RELEASED`
