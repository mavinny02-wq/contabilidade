# Contabilidade Fast Lane Wave 012

**Classificação:** `CANONICAL_RELEASED_WAVE`
**Status:** `RELEASED_FOR_EXECUTION`
**Contrato:** `2.0`
**Baseline comum:** `main@3850443701279e2002c527b6eb376de8abd664cf`
**Owners executáveis:** `5`
**Migration owner:** `NONE`
**Lane:** `FAST`

## Owners

| Slot | ITEM | Owner | Resultado |
|---:|---|---|---|
| 1 | `VAL-W011-FULLSTACK-012` | `FULLSTACK_POST_W011_VALIDATION` | smoke do HEAD atual |
| 2 | `STR-INF-002` | `TLS_CERTIFICATE_LIFECYCLE_GUARD` | lifecycle TLS/certificados |
| 3 | `STR-INF-003` | `ONPREMISE_IAC_DRIFT_GUARD` | IaC on-premise e drift |
| 4 | `STR-CI-003` | `LOCAL_REQUIRED_CI_PARITY` | paridade local do Required CI |
| 5 | `STR-OBS-003` | `SYNTHETIC_READINESS_MONITORING` | probes local-only |

## Dispatch keys

| ITEM | DISPATCH_KEY |
|---|---|
| `VAL-W011-FULLSTACK-012` | `ff45c84916215ff6f7b65e0dc9ef136eb1ad2267c9e3011ac3fb57475f2dcda0` |
| `STR-INF-002` | `e8ae86db201c9433389817bef310b600a56da7022e2fddabc705780b353930bc` |
| `STR-INF-003` | `4681cf70a21d90a7950bb3bced4f67233638b2ec6e7f9e83bf8e4df5f702ee38` |
| `STR-CI-003` | `8b5d2c9fa241db84a40aa516aee85af479565bd794f3e7ef60b534122d78057e` |
| `STR-OBS-003` | `fd02d2bca2f0b07e6ceba94a8126310d21aacc6a3616fdc0088076600580f93a` |

## Independência

- smoke escreve somente o relatório;
- TLS e IaC usam subtrees separados;
- CI local é o único owner de `scripts/ci/**`;
- synthetic monitoring usa subtree própria;
- nenhum slot depende de artefato produzido por outro slot da onda;
- nenhum owner cria migration ou altera dependency manifest;
- documentação canônica permanece com o orquestrador;
- providers reais, chamadas pagas, credenciais, certificados privados e dados reais são proibidos.

## Estratégia de validação

O smoke é único porque a Wave 011 alterou o handler de autorização e o wiring documental. Os demais
owners constroem tooling de prontidão de produção sem mutar hosts, certificados ou ambientes reais.

## Gates externos

Windows dev e segundo startup, on-premise/Keycloak, Required CI remoto, branch protection,
Testcontainers, restore real, promoção real e providers externos continuam fora da wave.

## Launcher pack

`docs/orquestracao/waves/released/CONTABILIDADE_FAST_LANE_WAVE_012_LAUNCHERS.txt`

`CONTABILIDADE_FAST_LANE_WAVE_012_RELEASED`
