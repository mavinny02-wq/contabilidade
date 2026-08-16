# Contabilidade Maturity Wave 004 — consumida

**Classificação:** `CANONICAL_CONSUMED_WAVE`  
**Status:** `CONSUMED`  
**Baseline de liberação:** `main@76258506f63777a228980b030857db1cefd89a43`  
**HEAD reconciliado após resultados:** `main@c3c06e8cb5921f96ecdb9b1e397594d01dd4430f`  
**Migration owner:** `NONE`

## Resultados integrados

| ITEM | PR | Resultado reconciliado |
|---|---:|---|
| `STR-SEC-001` | `#78` | scanner local/CI; baseline sem findings; testes sintéticos verdes |
| `BUG-ORQ-001` | `#79` | dispatchKey, preflight e contrato v2; auditoria GitHub pendente |
| `STR-DB-001` | `#80` | Testcontainers PostgreSQL 17 implementado; execução Docker pendente |
| `STR-WRK-001` | `#81` | regressões focadas verdes; suíte completa requer Chromium |
| `STR-DEP-001` | `#82` | SBOM/licenças reproduzíveis; advisory de rede pendente na CI |

## Disposição

- a wave não pode ser relançada;
- as lacunas Docker/Chromium seguem para `STR-CI-001`, sem repetir o full-stack amplo;
- segurança e SBOM determinísticos permanecem reutilizáveis;
- documentação de reconciliação foi mantida diretamente pelo orquestrador;
- nenhum provider real, dado real ou migration foi executado.

`CONTABILIDADE_MATURITY_WAVE_004_CONSUMED`
