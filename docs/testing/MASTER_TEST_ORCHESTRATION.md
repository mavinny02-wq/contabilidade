# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`
**Reconciliado em:** `2026-08-16`
**HEAD observado:** `d4c5391ebcf44b9fc7d3a7db7a488a5e7564889b`

Este ledger reutiliza prova válida e agenda somente owner explicitamente liberado.

## Evidência reutilizável

| ID | Owner | Resultado | Disposição |
|---|---|---|---|
| `VAL-STAB-FULLSTACK-001` | aplicação controlada | saúde, Flyway V12, heartbeat, 19 jornadas, zero externa/5xx | `REUSE_PASS_HISTORICAL` |
| `VAL-STAB-BACKEND-PG-002` | backend/PostgreSQL | 5 testes, 0 falhas/erros | `REUSE_PASS` |
| `STR-API-001` | OpenAPI | snapshot/compatibility/usage-map verdes | `REUSE_PASS` |
| `STR-DATA-001` | fixtures | catálogo/checksum/redaction verdes | `REUSE_PASS` |
| `STR-PERF-001` | budgets | baseline e growth guard verdes | `REUSE_PASS` |
| `STR-CI-002` | required gate | contrato, triggers e fan-in verdes localmente | `REMOTE_EXECUTION_NOT_PROVEN` |
| `STR-SEC-002` | supply chain | policy/fixtures verdes | `REMOTE_SCAN_PENDING` |
| `STR-FE-BUNDLE-001` | frontend | Node 24, 22 testes, build e chunk 412.562 bytes | `REUSE_PASS` |
| `STR-OBS-001` | backend/worker | 3 testes Java e 4 testes worker focados | `REUSE_PASS_WITH_NODE20_LIMITATION` |
| `STR-ARCH-001` | arquitetura | 591 arestas; 10 findings governados | `REUSE_PASS` |

## Invalidação focada após a Wave 006

A lazy loading, o filtro HTTP e a propagação worker-backend mudaram caminhos transversais. Por isso,
a prova full-stack histórica continua útil como referência, mas não fecha o novo HEAD. A disposição
correta é um único rerun consolidado:

```text
VAL-W006-FULLSTACK-007 = RERUN_FOCUSED
```

Não repetir suites ou ondas que não foram afetadas.

## Coverage observado antes da Fast Lane

| Componente | Linhas | Branches | Complete |
|---|---:|---:|---|
| backend | 14.7841% | 5.2195% | sim |
| frontend | 35.17% | 80.30% | sim no baseline anterior ao lazy split |
| worker | 40.64% | 71.68% | não — browser ausente |

`STR-QA-WRK-002` só pode promover o worker para `COMPLETE` após Node 24, Chromium, suíte inteira,
coverage e ratchet verdes. Falha não autoriza reduzir threshold nem editar produção.

## GitHub Actions

A listagem do repositório continua com nove runs históricas; a mais recente é de `2026-08-11`.

```text
REQUIRED_CI_REMOTE = NOT_PROVEN
BRANCH_PROTECTION = NOT_ENABLED
ACTIONS_SETTINGS_OR_PERMISSION = EXTERNAL_BLOCKER
```

Não consumir slot adicional para reescrever o mesmo workflow enquanto o bloqueio for externo.

## Fast Lane Wave 007

| ITEM | Prova | Disposição esperada |
|---|---|---|
| `VAL-W006-FULLSTACK-007` | PostgreSQL, Flyway V12, backend, worker, frontend, 19+ jornadas e zero externa/5xx | `PASS` ou classificação exata |
| `STR-FE-001` | keyboard/focus/a11y/browser das rotas representativas | `PASS` |
| `STR-API-002` | call sites frontend ↔ usage map ↔ OpenAPI | `PASS` |
| `STR-QA-WRK-002` | Node 24 + Chromium + full tests/build/coverage | `PASS_COMPLETE` |
| `STR-CTX-001` | reported vs estimated tokens, custo/outcome, redaction | `PASS` |

## Campanhas pendentes fora dos slots

- Windows dev e segundo startup: `LOCAL_WINDOWS_MANUAL`;
- on-premise/Keycloak: bloqueado até Windows dev verde;
- advisory/container feeds: execução remota;
- branch protection: somente depois do check remoto observado.

## Ondas

- Wave 006: `CONSUMED`;
- Wave 007: `RELEASED_FOR_EXECUTION`;
- migration owner: `NONE`.

Classificações de falha:
`PRODUCT_REGRESSION`, `TEST_CONTRACT_DRIFT`, `DATA_OR_FIXTURE_DEFECT`,
`ENVIRONMENT_LIMITATION`, `BASELINE_DRIFT` e `PRODUCT_GOVERNANCE_DEFECT`.

`MASTER_TEST_ORCHESTRATION_FAST_LANE_WAVE_007_RELEASED`
