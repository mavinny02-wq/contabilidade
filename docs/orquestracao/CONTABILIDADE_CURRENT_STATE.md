# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`
**Reconciliado em:** `2026-08-16`
**Branch de integração:** `main`
**HEAD reconciliado:** `77141fae2f04a430bc2cb51264886c083977a3ce`
**Versão declarada:** `0.5.1`
**Frontier Flyway:** `V12`
**Modo:** `FAST_LANE_WAVE_008_RELEASED`

## Verdade de integração

- A Fast Lane Wave 007 foi integrada pelas PRs `#96`, `#97`, `#98`, `#99` e `#100`.
- O delta posterior `FIX-BUILDX-STARTUP-001` foi integrado pela PR `#101`, com correção estrutural
  do bootstrap Buildx e runtime Windows ainda pendente.
- **PR aberta na reconciliação:** nenhuma.
- Nenhum owner de migration está aberto ou liberado.
- A `main` continua sem branch protection/ruleset obrigatório.
- O HEAD reconciliado não possui workflow run nem status check observável.
- A ausência de execução remota continua classificada como
  `GITHUB_ACTIONS_SETTINGS_OR_PERMISSION_BLOCKER`, não como `PASS`.

## Resultado da Fast Lane Wave 007

| ITEM | Resultado | Disposição |
|---|---|---|
| `VAL-W006-FULLSTACK-007` | Node 24, Java 21, Flyway V1–V12, health, heartbeat e 19 jornadas; zero externa/5xx | `PASS` |
| `STR-FE-001` | 24 testes frontend e 6 smokes Chromium/axe; zero violação critical/serious | `PASS` |
| `STR-API-002` | 13 testes e inventário determinístico call sites ↔ usage map ↔ OpenAPI | `PASS` |
| `STR-QA-WRK-002` | 15 testes e coverage reproduzível: linhas 58,9251%, branches 69,2913%, funções 66,0494% | `PASS_COMPLETE` |
| `STR-CTX-001` | schema, parser, redaction, deduplicação, budgets e custo/outcome com 6 testes | `PASS` |

## Evidência e validade

```text
POST_W006_FULLSTACK: PASS
FRONTEND_ACCESSIBILITY_BROWSER: PASS
API_CONSUMER_SOURCE_MAPPING: PASS
WORKER_FULL_SUITE_AND_COVERAGE: PASS_COMPLETE
TOKEN_OUTCOME_TELEMETRY: PASS
FIX_BUILDX_STARTUP_001: PASS_STRUCTURAL_WINDOWS_RUNTIME_PENDING
CURRENT_HEAD_POST_W007_AND_STARTUP_FULLSTACK: RERUN_FOCUSED_RELEASED
BACKEND_CRITICAL_EXECUTION_TESTS: RELEASED
OPERATIONAL_SLO_ALERTING: RELEASED
ARCHITECTURE_ALLOWLIST: 10_FINDINGS; WORKER_TRANCHE_RELEASED
TASK_CLASS_TOKEN_BUDGETS: RELEASED
REQUIRED_CI_REMOTE: NOT_PROVEN_EXTERNAL_BLOCKER
BRANCH_PROTECTION: NOT_ENABLED
WINDOWS_DEV_DOCKER_DESKTOP: NOT_PROVEN
WINDOWS_SECOND_START_REUSE: NOT_PROVEN
ONPREMISE_KEYCLOAK_LOGIN: BLOCKED_UNTIL_DEV_GREEN
REAL_EXTERNAL_PROVIDERS: NOT_AUTHORIZED_NOT_REQUIRED
```

O smoke da PR `#98` comprovou a baseline pós-Wave 006. Depois dele, a Wave 007 alterou shell,
modal, estilos e tooling frontend, além de contracts, coverage do worker e telemetria. A PR `#101`
também alterou o bootstrap Docker/Buildx. Por isso a Wave 008 contém um único rerun full-stack
focado no HEAD atual e o guard estrutural da orquestração Docker; ele não autoriza correção de
produto nem reivindica prova Windows dentro do owner de validação.

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
- `CONTABILIDADE_FAST_LANE_WAVE_007`: `CONSUMED`;
- `CONTABILIDADE_FAST_LANE_WAVE_008`: `RELEASED_FOR_EXECUTION`;
- owners executáveis liberados: `5`;
- migration owner: `NONE`.

## Fast Lane Wave 008

1. `VAL-W007-FULLSTACK-008` — smoke consolidado do HEAD atual e guard Docker, produto read-only;
2. `STR-QA-BE-001` — testes críticos de fila, lease, idempotência, retry e recuperação;
3. `STR-OBS-002` — SLOs, métricas bounded, alertas Prometheus e runbooks acionáveis;
4. `STR-ARCH-002` — remover os quatro findings `worker.core_to_provider` sem alterar fluxos;
5. `STR-CTX-002` — budgets automáticos por classe de task sobre a telemetria já integrada.

Os cinco owners partem de `main@77141fae2f04a430bc2cb51264886c083977a3ce`, não possuem dependência same-wave e não criam
migration.

## Próxima transição

Integrar e reconciliar os cinco resultados. Depois:

- corrigir somente regressões comprovadas e sempre em successor próprio;
- avaliar um owner futuro para atualizar o baseline de coverage do frontend pós-lazy/a11y;
- manter restore, deploy on-premise e branch protection fora dos slots enquanto seus gates externos
  permanecerem fechados;
- selecionar documentação/storage somente após decompor `STR-DOC-001`.

`CONTABILIDADE_CURRENT_STATE_FAST_LANE_WAVE_008_RELEASED`
