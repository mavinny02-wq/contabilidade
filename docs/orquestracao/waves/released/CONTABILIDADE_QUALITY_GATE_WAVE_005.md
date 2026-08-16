# Contabilidade Quality Gate Wave 005

**Classificação:** `CANONICAL_RELEASED_WAVE`  
**Status:** `RELEASED_FOR_EXECUTION`  
**Contrato:** `2.0`  
**Baseline comum:** `main@c3c06e8cb5921f96ecdb9b1e397594d01dd4430f`  
**Owners executáveis:** `5`  
**Principais:** `3`  
**Extras:** `2`  
**Migration owner:** `NONE`

## Objetivo

Transformar os controles já implementados em um gate confiável de integração, medir qualidade real
e adicionar contratos determinísticos sem repetir a campanha full-stack ampla.

## Owners principais

| Slot | ITEM | Owner | Resultado |
|---:|---|---|---|
| 1 | `STR-CI-001` | `REQUIRED_CI_GATE` | check final estável, Docker/Testcontainers e worker/Chromium verdes |
| 2 | `STR-QA-001` | `COVERAGE_GOVERNANCE` | baseline real por componente e ratchet reproduzível |
| 3 | `STR-API-001` | `API_CONTRACT` | OpenAPI canônico e compatibility guard |

## Extras

| Slot | ITEM | Owner | Resultado |
|---:|---|---|---|
| 4 | `STR-DATA-001` | `SYNTHETIC_DATA` | catálogo e geração determinística de fixtures sintéticas |
| 5 | `STR-PERF-001` | `PERFORMANCE_BUDGET` | budgets de artefatos e limite de crescimento |

Os extras contam no mesmo limite de cinco. Não existe sexto launcher nem reserva paralela.

## Idempotência de dispatch

Cada launcher usa contrato `2.0` com `WAVE_ID` e `DISPATCH_KEY`. Antes de editar, o executor deve
executar o preflight exato documentado no shard e registrar a chave. Resultado e PR devem expor a
mesma chave para auditoria.

| ITEM | DISPATCH_KEY |
|---|---|
| `STR-CI-001` | `d26681eceae7b6f3332378b27b3ce7e0b98f540519641153774217257f0a825f` |
| `STR-QA-001` | `88f897e1dc468bd04488dba240ba6b6d67c6c535f01843f2f074a3a341180226` |
| `STR-API-001` | `fbc08b313e084b952fdd0a3501df93a76e536bc56d687aa63cef7402b7c1b996` |
| `STR-DATA-001` | `835bed59be0169475abb1edc00b554f04d773f255d478b691d7bd1903f25a6af` |
| `STR-PERF-001` | `e7203ebb99c0a8858c4c7c2ee8071c11f7e58356d874c45876e6a81251e7d9a1` |

## Independência

- `STR-CI-001` cria o workflow agregador e scripts `scripts/ci/**`; workflows atuais são read-only;
- `STR-QA-001` é o único owner de manifests e lockfiles nesta wave;
- `STR-API-001` não altera dependências, manifests ou required gate;
- `STR-DATA-001` usa paths próprios e não modifica o scanner de segredo/PII;
- `STR-PERF-001` mede artefatos, mas não otimiza código nem altera manifests;
- nenhum owner cria migration;
- nenhuma task depende da saída de outra task da mesma wave.

## Required check pretendido

O check final deverá aparecer de forma estável como:

```text
Required CI / required-ci
```

Branch protection não é slot desta wave. Ela só será habilitada depois de uma execução real e
observável do check, evitando proteger a `main` com um nome inexistente ou instável.

## Evidência reutilizada

- backend produto/PostgreSQL 16, frontend Node 24 e full-stack controlado permanecem verdes;
- a nova prova Testcontainers/PostgreSQL 17 é rerun focado dentro de `STR-CI-001`;
- a suíte completa do worker após o delta de confiabilidade é rerun focado com Chromium;
- secret/PII e SBOM/licenças determinísticos não são repetidos fora do gate necessário;
- provider real, chamada paga, credencial e dado real permanecem proibidos.

## Campanhas externas

Windows dev pode executar em paralelo e não consome slot. On-premise + Keycloak continua bloqueado
até Windows dev ficar verde.

## Launcher pack

`docs/orquestracao/waves/released/CONTABILIDADE_QUALITY_GATE_WAVE_005_LAUNCHERS.txt`

`CONTABILIDADE_QUALITY_GATE_WAVE_005_RELEASED`
