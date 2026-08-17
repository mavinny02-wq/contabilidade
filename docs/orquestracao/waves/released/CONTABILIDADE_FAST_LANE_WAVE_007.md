# Contabilidade Fast Lane Wave 007

**Classificação:** `CANONICAL_RELEASED_WAVE`
**Status:** `RELEASED_FOR_EXECUTION`
**Contrato:** `2.0`
**Baseline comum:** `main@d4c5391ebcf44b9fc7d3a7db7a488a5e7564889b`
**Owners executáveis:** `5`
**Migration owner:** `NONE`
**Lane:** `FAST`

## Critério de fast lane

- escopo pequeno e verificável;
- nenhum owner depende de GitHub Actions, Windows ou provider;
- nenhum owner cria migration;
- nenhuma documentação-only é enviada ao Codex;
- nenhum owner pode ampliar escopo após encontrar falha: classifica e cria successor.

## Owners

| Slot | ITEM | Owner | Resultado |
|---:|---|---|---|
| 1 | `VAL-W006-FULLSTACK-007` | `FULLSTACK_POST_W006_VALIDATION` | prova integrada pós-hardening |
| 2 | `STR-FE-001` | `FRONTEND_ACCESSIBILITY` | a11y/teclado/foco/browser |
| 3 | `STR-API-002` | `API_CONSUMER_CONTRACT` | call sites ↔ usage map ↔ OpenAPI |
| 4 | `STR-QA-WRK-002` | `WORKER_COVERAGE_COMPLETE` | worker complete em Node 24 + Chromium |
| 5 | `STR-CTX-001` | `ORCHESTRATION_TOKEN_TELEMETRY` | tokens/custo por outcome sem conteúdo |

## Dispatch keys

| ITEM | DISPATCH_KEY |
|---|---|
| `VAL-W006-FULLSTACK-007` | `e82ffab2bfaac2412a1d9d885845bdd6b4489ce14e86e9e0630418ae7cf36563` |
| `STR-FE-001` | `8879bbc739dfa5cc339b4150f6650bcdd854190bc864bdd00db987941bd85d29` |
| `STR-API-002` | `e6a099540075a3f9d8998575595ee6d7b61dbb5e6d7af9acc982ed58e1b05743` |
| `STR-QA-WRK-002` | `a0c5e2fe0ce3a26cefec64e0d92bf540e5dc2397f593de2752771b2d51a707c9` |
| `STR-CTX-001` | `1e0c682805c8f0407d0594c5a51ef5698726c40b944deee5222f8260f2b97bc2` |

## Independência

- o smoke escreve somente seu relatório;
- acessibilidade é o único owner de escrita no frontend;
- consumer contract lê frontend e escreve somente contracts/tooling;
- worker coverage não altera produção;
- token telemetry não acessa produto nem prompt bruto;
- todos partem da mesma baseline;
- documentação canônica permanece com o orquestrador.

## Gates externos

`Required CI / required-ci` e branch protection continuam bloqueados por configuração/permissão
externa e não consomem slot desta fast lane.

## Launcher pack

`docs/orquestracao/waves/released/CONTABILIDADE_FAST_LANE_WAVE_007_LAUNCHERS.txt`

`CONTABILIDADE_FAST_LANE_WAVE_007_RELEASED`
