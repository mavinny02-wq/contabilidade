# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`
**Reconciliado em:** `2026-08-16`
**HEAD observado:** `77141fae2f04a430bc2cb51264886c083977a3ce`

Este ledger reutiliza prova válida e agenda somente owner explicitamente liberado.

## Evidência reutilizável

| ID | Owner | Resultado | Disposição |
|---|---|---|---|
| `VAL-W006-FULLSTACK-007` | aplicação controlada | Node 24, Flyway V12, health, heartbeat, 19 jornadas, zero externa/5xx | `REUSE_PASS` |
| `STR-FE-001` | frontend a11y | 24 testes + 6 browser/axe, zero critical/serious | `REUSE_PASS` |
| `STR-API-002` | contrato consumidor | 13 testes, inventário determinístico e compatibilidade | `REUSE_PASS` |
| `STR-QA-WRK-002` | worker completo | 15 testes; coverage reproduzível e completo | `REUSE_PASS_COMPLETE` |
| `STR-CTX-001` | telemetria | 6 testes; reported/estimated, redaction, duplicate, budget e custo | `REUSE_PASS` |
| `FIX-BUILDX-STARTUP-001` | startup Docker | guard e 2 testes Node verdes; runtime PowerShell/Docker pendente | `REUSE_PASS_STRUCTURAL` |
| `STR-API-001` | OpenAPI | snapshot/compatibility/usage-map verdes | `REUSE_PASS` |
| `STR-DATA-001` | fixtures | catálogo/checksum/redaction verdes | `REUSE_PASS` |
| `STR-PERF-001` | budgets de artefato | baseline e growth guard verdes | `REUSE_PASS` |
| `STR-SEC-002` | supply chain | policy/fixtures verdes | `REMOTE_SCAN_PENDING` |
| `STR-ARCH-001` | arquitetura | 591 arestas; 10 findings governados | `REUSE_PASS` |

## Invalidação focada após a Wave 007

O smoke da Wave 007 foi executado antes da integração final de shell/modal/a11y e das alterações de
tooling. Depois, a PR `#101` alterou o bootstrap Docker/Buildx. Contracts, telemetria e comandos de
coverage não exigem uma campanha ampla; o HEAD atual exige somente um rerun consolidado da aplicação
e a repetição do guard estrutural da orquestração Docker:

```text
VAL-W007-FULLSTACK-008 = RERUN_FOCUSED
```

O owner de validação é read-only. Falha gera classificação e successor, nunca correção silenciosa.
Esse owner não substitui PowerShell, Docker Desktop ou duas execuções reais no Windows.

## Coverage observado

| Componente | Linhas | Branches | Funções | Complete | Disposição |
|---|---:|---:|---:|---|---|
| backend | 14,7841% | 5,2195% | não registrado aqui | sim | baseline baixo; testes críticos liberados |
| frontend | 35,17% | 80,30% | não registrado aqui | baseline anterior ao lazy/a11y | `FOCUSED_RERUN_FUTURE` |
| worker | 58,9251% | 69,2913% | 66,0494% | sim | `REUSE_PASS_COMPLETE` |

`STR-QA-BE-001` não pode alterar produção, reduzir thresholds nem promover números sem uma medição
reproduzível. Ele fecha cenários críticos; atualização global de baseline continua fora do owner.

## GitHub Actions

O HEAD `77141fae2f04a430bc2cb51264886c083977a3ce` não possui workflow run ou status check observável, e a branch não está
protegida.

```text
REQUIRED_CI_REMOTE = NOT_PROVEN
BRANCH_PROTECTION = NOT_ENABLED
ACTIONS_SETTINGS_OR_PERMISSION = EXTERNAL_BLOCKER
```

Não consumir slot adicional para reescrever o mesmo workflow enquanto o bloqueio for externo.

## Fast Lane Wave 008

| ITEM | Prova | Disposição esperada |
|---|---|---|
| `VAL-W007-FULLSTACK-008` | guard Docker, build completo, Flyway V12, health, heartbeat, 19+ jornadas, a11y local, zero externa/5xx | `PASS` ou classificação exata |
| `STR-QA-BE-001` | PostgreSQL/Testcontainers para idempotência, leases concorrentes, tokens inválidos, retry e recuperação | `PASS` |
| `STR-OBS-002` | métricas bounded, regras de alerta válidas, fixtures de firing/recovery e runbook mapeado | `PASS_STRUCTURAL` |
| `STR-ARCH-002` | guard arquitetural reduz `worker.core_to_provider` de 4 para 0 e findings totais de 10 para 6 | `PASS` |
| `STR-CTX-002` | policy determinística por task class, warning/breach, custo, redaction e outputs reproduzíveis | `PASS` |

## Campanhas pendentes fora dos slots

- Windows dev e segundo startup: `LOCAL_WINDOWS_MANUAL`;
- on-premise/Keycloak: bloqueado até Windows dev verde;
- advisory/container feeds: execução remota;
- branch protection: somente depois do check remoto observado;
- providers fiscais reais/pagos: não autorizados e não necessários.

## Ondas

- Wave 007: `CONSUMED`;
- Wave 008: `RELEASED_FOR_EXECUTION`;
- migration owner: `NONE`.

Classificações de falha:
`PRODUCT_REGRESSION`, `TEST_CONTRACT_DRIFT`, `DATA_OR_FIXTURE_DEFECT`,
`ENVIRONMENT_LIMITATION`, `BASELINE_DRIFT` e `PRODUCT_GOVERNANCE_DEFECT`.

`MASTER_TEST_ORCHESTRATION_FAST_LANE_WAVE_008_RELEASED`
