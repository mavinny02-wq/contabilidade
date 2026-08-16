# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`
**Reconciliado em:** `2026-08-16`
**HEAD observado:** `a3344a15a0581fd7f76f78766c6432b46f9a361e`

Este ledger reutiliza prova válida e agenda somente owner explicitamente liberado.

## Evidência reutilizável

| ID | Owner | Resultado | Disposição |
|---|---|---|---|
| `VAL-STAB-FULLSTACK-001` | aplicação controlada | saúde, Flyway V12, heartbeat, 19 jornadas, zero externa/5xx | `REUSE_PASS` |
| `VAL-STAB-BACKEND-PG-002` | backend/PostgreSQL | 5 testes, 0 falhas/erros | `REUSE_PASS` |
| `VAL-STAB-FRONTEND-NODE24-002` | frontend | i18n, typecheck, 20 testes e build | `REUSE_PASS` |
| `STR-SEC-001` | secret/PII | baseline sem findings e testes sintéticos | `DONE` |
| `STR-DEP-001` | SBOM/licenças | 3 SBOMs reproduzíveis e policy tests | `DONE_NETWORK_SCAN_PENDING` |
| `STR-CI-001` | required gate | contrato estático e fan-in implementados | `REMOTE_EXECUTION_NOT_PROVEN` |
| `STR-QA-001` | coverage | baseline por componente; worker incomplete | `DONE_WITH_LIMITATION` |
| `STR-API-001` | OpenAPI | snapshot/compatibility/usage-map verdes | `DONE` |
| `STR-DATA-001` | fixtures | catálogo/checksum/redaction verdes | `DONE` |
| `STR-PERF-001` | budgets | baseline e growth guard verdes | `DONE` |

## Coverage observado

| Componente | Linhas | Branches | Complete |
|---|---:|---:|---|
| backend | 14.7841% | 5.2195% | sim |
| frontend | 35.17% | 80.30% | sim |
| worker | 40.64% | 71.68% | não — browser ausente |

O ratchet não pode aceitar baseline incompleto do worker como autoridade final.

## GitHub Actions

A listagem do repositório contém nove runs históricos; a mais recente é de `2026-08-11`.
Nenhuma run associada às PRs recentes ou ao workflow `Required CI` foi observada. Até prova nova:

```text
REQUIRED_CI_REMOTE = NOT_PROVEN
BRANCH_PROTECTION = NOT_ENABLED
ACTIONS_SETTINGS = NOT_READABLE_BY_CONNECTED_INTEGRATION
```

Não classificar ausência de run como PASS. `STR-CI-002` é o owner focado.

## Invalidação pela Wave 006

- `STR-CI-002`: somente contrato/execução do gate;
- `STR-SEC-002`: nova evidência de supply chain;
- `STR-FE-BUNDLE-001`: invalida frontend build/performance, não backend/worker;
- `STR-OBS-001`: invalida testes focados de backend/worker tocados;
- `STR-ARCH-001`: source read-only; não invalida runtime.

## Campanhas pendentes

- Windows dev e segundo startup: `LOCAL_WINDOWS_MANUAL`;
- on-premise/Keycloak: bloqueado até Windows dev verde;
- advisory/container feeds: execução de CI, sem PASS quando feed indisponível;
- worker coverage completo: rerun com Chromium;
- required check remoto: PR real após Wave 006.

## Ondas

- Wave 005: `CONSUMED`;
- Wave 006: `RELEASED_FOR_EXECUTION`;
- migration owner: `NONE`.

Classificações de falha permanecem:
`PRODUCT_REGRESSION`, `TEST_CONTRACT_DRIFT`, `DATA_OR_FIXTURE_DEFECT`,
`ENVIRONMENT_LIMITATION`, `BASELINE_DRIFT` e `PRODUCT_GOVERNANCE_DEFECT`.

`MASTER_TEST_ORCHESTRATION_WAVE_006_RELEASED`
