# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`
**Reconciliado em:** `2026-08-17`
**HEAD observado:** `d14e8624cafb23462abc3cc693a798459fcd870e`

Este ledger reutiliza prova válida e agenda somente owner explicitamente liberado.

## Evidência reutilizável

| ID | Prova | Disposição |
|---|---|---|
| `VAL-W008-FULLSTACK-009` | PostgreSQL/Flyway/JPA, health, heartbeat, 19 jornadas, a11y, zero externa/5xx | `REUSE_PASS_RUNTIME` |
| `STR-ARCH-BE-003` | architecture guard: 600 arestas e 4 findings | `REUSE_PASS_STRUCTURAL` |
| `STR-QA-FE-002` | Node 24, 24 testes, duas medições idênticas, a11y 6/6 | `REUSE_PASS_COMPLETE` |
| `STR-DOC-002` | storage local: 6 testes adversariais verdes duas vezes | `REUSE_PASS` |
| `STR-SEC-IAM-001` | guard/10 testes verdes; produto aceita authority desconhecida | `FIX_PRODUCT` |
| `STR-QA-WRK-002` | worker: 15 testes e coverage completo | `REUSE_PASS` |
| `STR-OBS-002` | 15 alertas, 7 SLOs e guard | `REUSE_PASS_STRUCTURAL` |

A falha global originalmente registrada em `VAL-W008-FULLSTACK-009` era exclusivamente
`BASELINE_DRIFT` arquitetural. Como o owner arquitetural da mesma onda passou no baseline final, o
runtime não precisa ser repetido para reconciliar esse resultado.

## Evidência Windows

| Etapa | Resultado |
|---|---|
| build backend/frontend/worker | `PASS_USER_EVIDENCE` |
| três imagens runtime | `PASS_USER_EVIDENCE` |
| contexto Docker | correção integrada; rerun pendente |
| DNS/registry | contrato PRIMA integrado |
| parser PowerShell | defeito corrigido; guard adicionado |
| stack dev após fix | `NOT_PROVEN` |
| segundo startup/reuso | `NOT_PROVEN` |

## Fast Lane Wave 010

| ITEM | Prova exigida | Disposição esperada |
|---|---|---|
| `FIX-SEC-IAM-001` | authorities conhecidas preservadas e desconhecidas rejeitadas | `PASS` |
| `FIX-STARTUP-PREFLIGHT-001` | parse-all antes de Maven/npm/build no PowerShell 5.1 | `PASS_STRUCTURAL_WINDOWS_RUNTIME_PENDING` |
| `VAL-TECH-CONSOLE-CURRENT-001` | endpoints atuais, erros, autorização e UI contratual | `PASS` ou classificação exata |
| `STR-ARCH-BE-004` | três imports removidos; findings 4 → 1 | `PASS_STRUCTURAL` |
| `STR-INF-001` | inventário determinístico e drift dev/on-premise/CI | `PASS_STRUCTURAL` |

## Provas pendentes fora dos slots

### Backend/Testcontainers

```bash
cd backend
mvn -B -Dtest=ExecucaoFilaPostgresqlTest test
mvn -B -Dtest=ExecucaoFilaPostgresqlTest test
```

### Windows

```powershell
git switch main
git pull --ff-only
.\START_CONTABILIDADE.bat dev
```

Depois, executar novamente para comprovar reuso do PostgreSQL e coletar a evidência v2.

## Políticas

- validação não corrige produto dentro do mesmo owner;
- falha de ambiente não reduz threshold e não vira `PASS`;
- claims desconhecidas não podem virar authority;
- endpoints de outra baseline são `BASELINE_DRIFT`, não requisito;
- baseline arquitetural só muda após inventário revisado;
- configuração runtime permanece read-only no guard de ambientes;
- nenhum provider real, dado real ou migration pertence à Wave 010.

## Gates externos

```text
BACKEND_TESTCONTAINERS_RUNTIME = WAITING_FOR_DOCKER
REQUIRED_CI_REMOTE = NOT_PROVEN
BRANCH_PROTECTION = NOT_ENABLED
WINDOWS_DEV = NOT_PROVEN_AFTER_LATEST_FIX
WINDOWS_SECOND_START = NOT_PROVEN
ONPREMISE_KEYCLOAK = BLOCKED_UNTIL_WINDOWS_DEV_GREEN
REAL_EXTERNAL_PROVIDERS = NOT_AUTHORIZED
```

`MASTER_TEST_ORCHESTRATION_FAST_LANE_WAVE_010_RELEASED`
