# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`  
**Reconciliado em:** `2026-08-16`  
**Branch de integração:** `main`  
**HEAD reconciliado:** `c3c06e8cb5921f96ecdb9b1e397594d01dd4430f`  
**Versão declarada:** `0.5.1`  
**Frontier Flyway:** `V12`  
**Modo:** `QUALITY_GATE_WAVE_005_RELEASED`

## Verdade de integração

- A Wave 004 foi integrada pelas PRs `#78`, `#79`, `#80`, `#81` e `#82`.
- **PR aberta na reconciliação:** nenhuma.
- Nenhum owner de migration está aberto.
- A `main` continua sem branch protection/ruleset obrigatório.
- Nenhum status/check de GitHub Actions foi observado nos commits consultados; não tratar isso como
  CI verde. O successor é `STR-CI-001`.

## Resultado da Wave 004

| ITEM | Resultado | Disposição |
|---|---|---|
| `BUG-ORQ-001` | `dispatchKey`, manifest/launcher v2, preflight local e 19 testes focados | `DONE`; modo GitHub-aware ainda sem prova |
| `STR-SEC-001` | baseline rastreado sem achados; 3 testes sintéticos de segredo/PII | `DONE` |
| `STR-DEP-001` | 3 SBOMs CycloneDX reproduzíveis; 7 testes de licença/advisory | `DONE_WITH_NETWORK_SCAN_PENDING` |
| `STR-DB-001` | Testcontainers/PostgreSQL 17 implementado e test-compile verde | `IMPLEMENTED_AWAITING_DOCKER_CI` |
| `STR-WRK-001` | 4 regressões de lease/retry/idempotência/shutdown verdes | `PASS_WITH_BROWSER_RERUN_PENDING` |

## Evidência e validade

```text
CORE_APPLICATION_CLOUD: GREEN_REUSABLE
BACKEND_PRODUCT_POSTGRESQL_16: GREEN_REUSABLE
FRONTEND_NODE24: GREEN_REUSABLE
FLYWAY_V1_V12: GREEN_REUSABLE
SECRET_PII_BASELINE: GREEN
SBOM_DETERMINISTIC: GREEN
DISPATCH_IDEMPOTENCY_LOCAL: GREEN
BACKEND_TESTCONTAINERS_POSTGRESQL_17: NOT_PROVEN_NO_DOCKER
WORKER_RELIABILITY_FOCUSED: GREEN
WORKER_FULL_SUITE_AFTER_RELIABILITY_DELTA: RERUN_FOCUSED_REQUIRED
REQUIRED_CI_STATUS: NOT_ESTABLISHED
AGGREGATE_COVERAGE: NOT_MEASURED
OPENAPI_COMPATIBILITY: NOT_GOVERNED
WINDOWS_DEV_DOCKER_DESKTOP: NOT_PROVEN
WINDOWS_SECOND_START_REUSE: NOT_PROVEN
ONPREMISE_KEYCLOAK_LOGIN: BLOCKED_UNTIL_DEV_GREEN
REAL_EXTERNAL_PROVIDERS: NOT_AUTHORIZED_NOT_REQUIRED
```

A mudança do worker invalida somente sua suíte completa/browser após o delta, não o full-stack inteiro.
A mudança do backend foi limitada à infraestrutura de teste; a prova do produto continua reutilizável,
mas a nova lane Testcontainers exige execução em Docker.

## Correção documental direta

O checkpoint contém explicitamente os marcadores `PR aberta` e `Frontier Flyway` exigidos pelo
governance guard. Essa correção é documentation-only do orquestrador e não consome slot.

## Campanha humana paralela

Windows dev permanece fora dos slots Codex:

1. atualizar `main`;
2. executar `START_CONTABILIDADE.bat dev`;
3. executar o coletor v2 em modo `dev`;
4. repetir o startup usando a evidência anterior;
5. reconciliar somente JSON/Markdown redigidos.

On-premise + Keycloak permanece bloqueado até o modo dev ficar verde.

## Ondas

- `CONTABILIDADE_STABILIZATION_WAVE_002`: `CONSUMED`;
- `CONTABILIDADE_STABILIZATION_WAVE_003`: `CONSUMED`;
- `CONTABILIDADE_MATURITY_WAVE_004`: `CONSUMED`;
- `CONTABILIDADE_QUALITY_GATE_WAVE_005`: `RELEASED_FOR_EXECUTION`;
- owners executáveis liberados: `5`;
- migration owner: `NONE`.

## Wave 005 — três owners principais + dois extras

Principais:

1. `STR-CI-001` — criar um único required gate estável e fechar as provas Docker/Chromium;
2. `STR-QA-001` — medir coverage real e criar ratchet baseado no baseline;
3. `STR-API-001` — snapshot OpenAPI e compatibility guard.

Extras, contando no mesmo limite de cinco:

4. `STR-DATA-001` — fixtures sintéticas governadas e detecção de dado real;
5. `STR-PERF-001` — budgets reproduzíveis de artefatos, incluindo o bundle frontend.

## Próxima transição

Integrar e reconciliar os cinco resultados. Depois:

- observar uma execução real do check estável;
- habilitar `STR-ORQ-001` manualmente no GitHub;
- incorporar coverage/contratos/budgets ao gate estável sem mudar seu nome;
- continuar Windows dev em paralelo.

`CONTABILIDADE_CURRENT_STATE_WAVE_005_RELEASED`
