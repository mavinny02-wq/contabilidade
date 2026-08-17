# Contabilidade Fast Lane Wave 008

**Classificação:** `CANONICAL_RELEASED_WAVE`
**Status:** `RELEASED_FOR_EXECUTION`
**Contrato:** `2.0`
**Baseline comum:** `main@77141fae2f04a430bc2cb51264886c083977a3ce`
**Owners executáveis:** `5`
**Migration owner:** `NONE`
**Lane:** `FAST`

## Critério de fast lane

- escopo pequeno, mensurável e com owner exato;
- nenhum owner depende de GitHub Actions, Windows, provider real ou dado real;
- nenhum owner cria migration;
- nenhuma documentação-only é enviada ao Codex;
- nenhum owner corrige área fora do boundary após encontrar falha;
- os cinco owners não possuem dependência entre si.

## Owners

| Slot | ITEM | Owner | Resultado |
|---:|---|---|---|
| 1 | `VAL-W007-FULLSTACK-008` | `FULLSTACK_POST_W007_VALIDATION` | smoke do HEAD + guard Docker |
| 2 | `STR-QA-BE-001` | `BACKEND_EXECUTION_CRITICAL_TESTS` | regressões críticas de fila/lease |
| 3 | `STR-OBS-002` | `OPERATIONAL_SLO_ALERTING` | SLOs, regras e runbooks |
| 4 | `STR-ARCH-002` | `WORKER_COMPOSITION_BOUNDARY` | findings worker 4 → 0 |
| 5 | `STR-CTX-002` | `ORCHESTRATION_TASK_BUDGETS` | budgets por classe de task |

## Dispatch keys

| ITEM | DISPATCH_KEY |
|---|---|
| `VAL-W007-FULLSTACK-008` | `226c9ff3c05b6024571a8b34eaaa9355c001b0d97870977502178db5aec5cd95` |
| `STR-QA-BE-001` | `620e49f09111d07764735c3161b8326c0d94639092a13fa93f6a40d4129bef85` |
| `STR-OBS-002` | `6cae6b84522ce540b1a2e0973d6572f5c8fadf34c1bb4a8591aafa7db2dc3be6` |
| `STR-ARCH-002` | `e5228142ef38fb8cb8af54b6a64abdeb8c9ffb01878a0ad8289a4d4055e491ac` |
| `STR-CTX-002` | `8acd65e9ceb5d163e2011cc1968db320fed6a2c288a5f72bebe42e4c944fe802` |

## Independência

- o smoke escreve somente seu relatório;
- backend quality altera somente testes de execução e não o baseline global;
- SLO/alerting possui pacote, infra, guard e runbook próprios;
- architecture altera somente composition root worker e inventário arquitetural;
- task budgets altera somente tooling de telemetria/orquestração;
- todos partem da mesma baseline;
- documentação canônica permanece com o orquestrador.

## Gates externos

`Required CI / required-ci`, branch protection, Windows dev, on-premise/Keycloak e providers reais
continuam fora desta fast lane.

## Launcher pack

`docs/orquestracao/waves/released/CONTABILIDADE_FAST_LANE_WAVE_008_LAUNCHERS.txt`

`CONTABILIDADE_FAST_LANE_WAVE_008_RELEASED`
