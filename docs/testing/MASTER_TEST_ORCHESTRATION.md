# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`
**Reconciliado em:** `2026-08-17`
**HEAD observado:** `3ca4bcfd60d8ddaa515bf526196833dccacf5e35`

Este ledger reutiliza prova válida, classifica falhas antes de corrigir e agenda somente owner
explicitamente liberado.

## Evidência reutilizável

| ID | Prova | Disposição |
|---|---|---|
| `FIX-SEC-IAM-001` | converter fail-closed, guard IAM, 10+4 testes | `REUSE_PASS` |
| `FIX-STARTUP-PREFLIGHT-001` | parse-first e guard Node; Windows pendente | `REUSE_PASS_STRUCTURAL_WITH_LIMITATION` |
| `STR-ARCH-BE-004` | 600 arestas e 1 finding permitido | `REUSE_PASS_STRUCTURAL` |
| `STR-INF-001` | inventário e fixtures dev/on-premise/CI | `REUSE_PASS_STRUCTURAL` |
| `VAL-W008-FULLSTACK-009` | PostgreSQL/Flyway/JPA, health, heartbeat, 19 jornadas, a11y, zero externa/5xx | `REUSE_PASS_RUNTIME` |
| `STR-QA-FE-002` | coverage reproduzível e a11y 6/6 | `REUSE_PASS_COMPLETE` |
| `STR-DOC-002` | storage local adversarialmente testado duas vezes | `REUSE_PASS` |

## Finding comprovado da Console Técnica

`VAL-TECH-CONSOLE-CURRENT-001` comprovou:

```text
autorizado -> PASS
não autorizado -> AccessDeniedException -> handler genérico -> HTTP 500
contrato esperado -> HTTP 403
```

Disposição: `FIX_PRODUCT` em `FIX-TECH-AUTH-001`.

O teste PostgreSQL da mesma task permaneceu `ENVIRONMENT_LIMITATION` por ausência de Docker e não
autoriza alteração de produto.

## Fast Lane Wave 011

| ITEM | Prova exigida | Disposição esperada |
|---|---|---|
| `FIX-TECH-AUTH-001` | 403 seguro, 401 preservado, 500 inesperado preservado, correlation ID | `PASS` |
| `STR-ARCH-BE-005` | Documento desacoplado; findings 1 → 0 | `PASS_STRUCTURAL` |
| `STR-SEC-003` | inventário redigido, rotação/source/exceções e determinismo | `PASS_STRUCTURAL` |
| `STR-REL-003` | promoção imutável e rollback/Flyway guardados | `PASS_STRUCTURAL` |
| `STR-OPS-002` | recovery plan determinístico, completo e não destrutivo | `PASS_STRUCTURAL` |

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

- `AccessDeniedException` não pode virar 500 nem 200;
- architecture remove somente o último finding mapeado;
- secret lifecycle nunca armazena valores;
- release tooling não publica nem puxa imagens;
- recovery tooling não restaura, apaga ou toca backup real;
- falha de ambiente não vira `PASS`;
- nenhum provider real, dado real ou migration pertence à Wave 011.

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

`MASTER_TEST_ORCHESTRATION_FAST_LANE_WAVE_011_RELEASED`
