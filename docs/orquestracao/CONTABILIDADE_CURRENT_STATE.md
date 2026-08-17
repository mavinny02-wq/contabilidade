# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`
**Reconciliado em:** `2026-08-16`
**Branch de integração:** `main`
**HEAD reconciliado:** `d4c5391ebcf44b9fc7d3a7db7a488a5e7564889b`
**Versão declarada:** `0.5.1`
**Frontier Flyway:** `V12`
**Modo:** `FAST_LANE_WAVE_007_RELEASED`

## Verdade de integração

- A Wave 006 foi integrada pelas PRs `#90`, `#91`, `#92`, `#93` e `#94`.
- **PR aberta na reconciliação:** nenhuma.
- Nenhum owner de migration está aberto.
- A `main` continua sem branch protection/ruleset obrigatório.
- A API de Actions continua exibindo somente nove runs históricas, com a mais recente em
  `2026-08-11`; nenhuma run das waves atuais foi observada.
- A ausência de run é `GITHUB_ACTIONS_SETTINGS_OR_PERMISSION_BLOCKER`, não `PASS`.

## Resultado da Wave 006

| ITEM | Resultado | Disposição |
|---|---|---|
| `STR-CI-002` | triggers PR/push/manual, controles Wave 005 e fan-in estável | `DONE_REMOTE_EVIDENCE_BLOCKED` |
| `STR-SEC-002` | SAST/IaC/container/provenance e policy tests | `DONE_CI_SCAN_PENDING` |
| `STR-FE-BUNDLE-001` | maior chunk caiu de 543.274 para 412.562 bytes | `DONE` |
| `STR-OBS-001` | correlação backend-worker, redaction e métricas bounded | `DONE_FOCUSED_RUNTIME_PENDING` |
| `STR-ARCH-001` | 591 arestas e 10 findings preexistentes governados | `DONE` |

## Evidência e validade

```text
CORE_APPLICATION_PRE_W006: REUSE_PASS_HISTORICAL
POST_W006_FULLSTACK: RERUN_FOCUSED_RELEASED
FRONTEND_LAZY_NODE24_BUILD: GREEN
FRONTEND_LARGEST_CHUNK: 412562_BYTES_GREEN
FRONTEND_ACCESSIBILITY_BROWSER: NOT_MEASURED
BACKEND_OBSERVABILITY_FOCUSED: GREEN
WORKER_OBSERVABILITY_FOCUSED: GREEN_NODE20_LIMITATION
WORKER_FULL_SUITE_AND_COVERAGE: RERUN_FOCUSED_RELEASED
OPENAPI_COMPATIBILITY: GREEN
API_CONSUMER_SOURCE_MAPPING: NOT_GOVERNED
ARCHITECTURE_BOUNDARIES: GREEN_WITH_10_EXPIRING_ALLOWLIST_ITEMS
SUPPLY_CHAIN_POLICY: GREEN_STRUCTURAL_REMOTE_SCAN_PENDING
REQUIRED_CI_REMOTE: NOT_PROVEN_EXTERNAL_BLOCKER
WINDOWS_DEV_DOCKER_DESKTOP: NOT_PROVEN
WINDOWS_SECOND_START_REUSE: NOT_PROVEN
ONPREMISE_KEYCLOAK_LOGIN: BLOCKED_UNTIL_DEV_GREEN
REAL_EXTERNAL_PROVIDERS: NOT_AUTHORIZED_NOT_REQUIRED
```

A Wave 007 não repete guards já verdes. Ela executa um smoke full-stack pós-Wave 006 e fecha
lacunas rápidas que não dependem de GitHub Actions, Windows, provider, dado real ou migration.

## Campanha humana paralela

Windows dev permanece fora dos slots Codex:

1. atualizar `main`;
2. executar `START_CONTABILIDADE.bat dev`;
3. coletar evidência v2 em modo `dev`;
4. repetir o startup com o estado anterior;
5. reconciliar apenas JSON/Markdown redigidos.

On-premise + Keycloak permanece bloqueado até o modo dev ficar verde.

## Ondas

- `CONTABILIDADE_STABILIZATION_WAVE_002`: `CONSUMED`;
- `CONTABILIDADE_STABILIZATION_WAVE_003`: `CONSUMED`;
- `CONTABILIDADE_MATURITY_WAVE_004`: `CONSUMED`;
- `CONTABILIDADE_QUALITY_GATE_WAVE_005`: `CONSUMED`;
- `CONTABILIDADE_HARDENING_WAVE_006`: `CONSUMED`;
- `CONTABILIDADE_FAST_LANE_WAVE_007`: `RELEASED_FOR_EXECUTION`;
- owners executáveis liberados: `5`;
- migration owner: `NONE`.

## Fast Lane Wave 007

1. `VAL-W006-FULLSTACK-007` — smoke full-stack pós-hardening, com Node 24 e rede externa bloqueada;
2. `STR-FE-001` — acessibilidade, teclado, foco e browser smoke das rotas lazy;
3. `STR-API-002` — contratos consumidores entre call sites frontend, usage map e OpenAPI;
4. `STR-QA-WRK-002` — suíte e coverage completos do worker com Node 24 + Chromium;
5. `STR-CTX-001` — telemetria de tokens/custo por outcome sem persistir prompts.

## Próxima transição

Integrar e reconciliar os cinco resultados. Depois:

- corrigir somente regressões comprovadas pelo smoke;
- promover o baseline completo do worker apenas se todas as provas passarem;
- selecionar testes críticos de backend e observabilidade operacional;
- manter branch protection bloqueada até existir uma run real do required check.

`CONTABILIDADE_CURRENT_STATE_FAST_LANE_WAVE_007_RELEASED`
