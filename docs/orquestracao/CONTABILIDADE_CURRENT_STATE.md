# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`
**Reconciliado em:** `2026-08-16`
**Branch de integração:** `main`
**HEAD reconciliado antes da liberação documental:** `a3344a15a0581fd7f76f78766c6432b46f9a361e`
**Versão declarada:** `0.5.1`
**Frontier Flyway:** `V12`
**Modo:** `HARDENING_WAVE_006_RELEASED`

## Verdade de integração

- A Wave 005 foi integrada pelas PRs `#84`, `#85`, `#86`, `#87` e `#88`.
- **PR aberta na reconciliação:** nenhuma.
- Nenhum owner de migration está aberto.
- A `main` continua sem branch protection/ruleset obrigatório.
- A API de runs mostra apenas nove execuções históricas, sendo a mais recente de `2026-08-11`;
  nenhuma execução das waves atuais foi observada. CI remota permanece `NOT_PROVEN`.

## Resultado da Wave 005

| ITEM | Resultado | Disposição |
|---|---|---|
| `STR-CI-001` | workflow `Required CI / required-ci` e fan-in implementados | `IMPLEMENTED_REMOTE_RUN_NOT_PROVEN` |
| `STR-QA-001` | coverage real medido; backend/frontend completos; worker incompleto sem Chromium | `DONE_WITH_WORKER_COMPLETENESS_PENDING` |
| `STR-API-001` | 41 paths, 62 operações, 55 schemas e compatibility guard | `DONE` |
| `STR-DATA-001` | catálogo e geração determinística de 4 fixtures sintéticas | `DONE` |
| `STR-PERF-001` | budgets dos três artefatos; maior chunk frontend ~530,5 KiB | `DONE_SUCCESSOR_REQUIRED` |

## Evidência e validade

```text
CORE_APPLICATION_CLOUD: GREEN_REUSABLE
BACKEND_POSTGRESQL_PRODUCT: GREEN_REUSABLE
FRONTEND_NODE24: GREEN_REUSABLE
FLYWAY_V1_V12: GREEN_REUSABLE
REQUIRED_CI_CONTRACT: GREEN_STATIC_REMOTE_NOT_PROVEN
COVERAGE_BACKEND: LINE_14.7841_BRANCH_5.2195_COMPLETE
COVERAGE_FRONTEND: LINE_35.17_BRANCH_80.30_COMPLETE
COVERAGE_WORKER: LINE_40.64_BRANCH_71.68_INCOMPLETE_BROWSER
OPENAPI_COMPATIBILITY: GREEN
SYNTHETIC_FIXTURE_GOVERNANCE: GREEN
ARTIFACT_PERFORMANCE_BASELINE: GREEN
FRONTEND_MAIN_CHUNK: ABOVE_500_KIB_SUCCESSOR_REQUIRED
WINDOWS_DEV_DOCKER_DESKTOP: NOT_PROVEN
WINDOWS_SECOND_START_REUSE: NOT_PROVEN
ONPREMISE_KEYCLOAK_LOGIN: BLOCKED_UNTIL_DEV_GREEN
REAL_EXTERNAL_PROVIDERS: NOT_AUTHORIZED_NOT_REQUIRED
```

Mudanças documentais não invalidam aplicação. A otimização do bundle invalidará somente frontend;
observabilidade invalidará os owners backend/worker tocados; o guard arquitetural e supply chain não
alteram produto.

## Campanha humana paralela

Windows dev permanece fora dos slots Codex:

1. atualizar `main`;
2. executar `START_CONTABILIDADE.bat dev`;
3. coletar evidência v2 em modo `dev`;
4. repetir o startup com estado anterior;
5. reconciliar apenas JSON/Markdown redigidos.

On-premise + Keycloak permanece bloqueado até o modo dev ficar verde.

## Ondas

- `CONTABILIDADE_STABILIZATION_WAVE_002`: `CONSUMED`;
- `CONTABILIDADE_STABILIZATION_WAVE_003`: `CONSUMED`;
- `CONTABILIDADE_MATURITY_WAVE_004`: `CONSUMED`;
- `CONTABILIDADE_QUALITY_GATE_WAVE_005`: `CONSUMED`;
- `CONTABILIDADE_HARDENING_WAVE_006`: `RELEASED_FOR_EXECUTION`;
- owners executáveis liberados: `5`;
- migration owner: `NONE`.

## Wave 006 liberada

1. `STR-CI-002` — execução observável e integração dos controles no required gate;
2. `STR-SEC-002` — SAST/IaC/container/provenance;
3. `STR-FE-BUNDLE-001` — reduzir o chunk inicial do frontend;
4. `STR-OBS-001` — correlação, logs e métricas sem PII;
5. `STR-ARCH-001` — grafo e boundaries arquiteturais.

## Próxima transição

Integrar e reconciliar os cinco resultados. Depois:

- observar run real de `Required CI / required-ci`;
- habilitar branch protection manualmente quando o check existir;
- completar coverage do worker após Chromium;
- preparar acessibilidade, restore e deploy/provenance conforme runtime Windows.

`CONTABILIDADE_CURRENT_STATE_WAVE_006_RELEASED`
