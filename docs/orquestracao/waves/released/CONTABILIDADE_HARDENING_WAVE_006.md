# Contabilidade Hardening Wave 006

**Classificação:** `CANONICAL_RELEASED_WAVE`
**Status:** `RELEASED_FOR_EXECUTION`
**Contrato:** `2.0`
**Baseline comum:** `main@a3344a15a0581fd7f76f78766c6432b46f9a361e`
**Owners executáveis:** `5`
**Migration owner:** `NONE`

## Objetivo

Fechar a observabilidade da CI, reduzir o risco de supply chain, corrigir o bundle inicial e
introduzir correlação e boundaries arquiteturais sem repetir o full-stack amplo.

## Owners

| Slot | ITEM | Owner | Resultado |
|---:|---|---|---|
| 1 | `STR-CI-002` | `REQUIRED_CI_GATE` | gate observável, triggers completos e controles Wave 005 integrados |
| 2 | `STR-SEC-002` | `SUPPLY_CHAIN_SECURITY` | SAST/IaC/container/provenance governados |
| 3 | `STR-FE-BUNDLE-001` | `FRONTEND_BUNDLE` | maior chunk bruto abaixo de 500 KiB |
| 4 | `STR-OBS-001` | `OBSERVABILITY` | correlação, logs e métricas sem PII |
| 5 | `STR-ARCH-001` | `ARCHITECTURE_GUARD` | grafo, ciclos e boundaries determinísticos |

## Dispatch keys

| ITEM | DISPATCH_KEY |
|---|---|
| `STR-CI-002` | `637a4ff2255908913d33d005b70d0bf1431ea273302816583a2bce736bcae4cd` |
| `STR-SEC-002` | `3088e636102f43188815c68c1cb2f9ab059befe9cfd09dc84da5b49b6d901547` |
| `STR-FE-BUNDLE-001` | `5bb7c05a84f55b04849a905fcdae4447b71f77ce9527c18b039cef2b15b8a04e` |
| `STR-OBS-001` | `12513604f08b8e970241633e0f7f9d9e0a2f01e2b7dc1594a837dd01f3037a65` |
| `STR-ARCH-001` | `2a7a896f3fa04ee0feb9d60a91967b578bba52c516450af017cbd0bcc6e1a185` |

## Independência

- nenhum owner cria migration;
- CI e supply chain possuem workflows/paths distintos;
- bundle é o único owner do frontend;
- observabilidade é o único owner de código backend/worker;
- arquitetura lê produto, mas escreve somente tooling;
- documentação, checkpoint, ledger e manifests ficam com o orquestrador.

## Evidência reutilizada

Backend produto, Flyway, OpenAPI, fixtures, budgets, secret/PII e coverage baseline não são
reexecutados fora do delta. Frontend será validado após chunking; backend/worker recebem somente
testes focados após observabilidade.

## Gate externo

Branch protection não faz parte desta wave. Ela só será habilitada depois de uma run real e estável
de `Required CI / required-ci`.

## Campanha Windows

Windows dev continua humana e paralela. On-premise + Keycloak segue bloqueado até dev verde.

## Launcher pack

`docs/orquestracao/waves/released/CONTABILIDADE_HARDENING_WAVE_006_LAUNCHERS.txt`

`CONTABILIDADE_HARDENING_WAVE_006_RELEASED`
