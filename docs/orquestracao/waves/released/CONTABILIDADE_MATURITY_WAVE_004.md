# Contabilidade Maturity Wave 004

**Classificação:** `CANONICAL_RELEASED_WAVE`
**Status:** `RELEASED_FOR_EXECUTION`
**Baseline observado:** `main@76258506f63777a228980b030857db1cefd89a43`
**Owners executáveis:** `5`
**Migration owner:** `NONE`

## Motivo

A Wave 003 fechou startup/tooling/governança. A aplicação permanece verde em ambiente controlado,
enquanto a prova Windows segue como campanha humana paralela. Esta wave fortalece segurança,
supply chain, banco reproduzível, worker e idempotência da própria orquestração.

## Owners

| Slot | ITEM | Owner | RESULT_MD |
|---:|---|---|---|
| 1 | `BUG-ORQ-001` | `DISPATCH_GOVERNANCE` | `docs/implementacao/BUG_ORQ_001_RESULT.md` |
| 2 | `STR-SEC-001` | `SECURITY_POLICY` | `docs/implementacao/STR_SEC_001_RESULT.md` |
| 3 | `STR-DEP-001` | `DEPENDENCY_INVENTORY` | `docs/implementacao/STR_DEP_001_RESULT.md` |
| 4 | `STR-DB-001` | `BACKEND_TEST_DATABASE` | `docs/implementacao/STR_DB_001_RESULT.md` |
| 5 | `STR-WRK-001` | `WORKER_RUNTIME` | `docs/implementacao/STR_WRK_001_RESULT.md` |

## Independência

- nenhuma migration;
- `STR-DEP-001` lê manifests, mas não os altera;
- `STR-DB-001` é o único owner de `backend/pom.xml`;
- `STR-WRK-001` é o único owner do runtime/testes do worker;
- cada tarefa cria workflow próprio e não altera `build.yml`;
- documentação canônica e manifests desta wave ficam fora dos executores.

## Evidência reutilizada

Backend, frontend, worker/Chromium, full-stack, Flyway, startup guard, version guard, CODEOWNERS e
wave lifecycle não são repetidos fora do delta de cada owner.

## Campanha Windows

Pode ocorrer em paralelo, mas não é slot Codex. On-premise + Keycloak continua condicionado ao
resultado dev.

`CONTABILIDADE_MATURITY_WAVE_004_RELEASED`
