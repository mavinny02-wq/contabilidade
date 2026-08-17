# Matriz de owners e hotspots

**Classificação:** `CANONICAL_ACTIVE_OWNER_MATRIX`

## Hotspots serializados

| Owner | Paths/autoridade | Regra |
|---|---|---|
| `ROOT_GOVERNANCE` | AGENTS, índices, locks | orquestrador/documentação direta |
| `ORCHESTRATION_STATE` | checkpoint, ledger, backlog, manifests | orquestrador somente |
| `MIGRATION_LANE` | `backend/src/main/resources/db/migration/**` | máximo um owner |
| `REQUIRED_CI_GATE` | `.github/workflows/required-ci.yml`, `scripts/ci/**` | bloqueado por setting externo |
| `DEPENDENCY_LOCKS` | POM/package/lockfiles | owner explícito |
| `STARTUP_DEPLOY` | Compose/startup/deploy | serial |

## Fast Lane Wave 009

| ITEM | Owner exclusivo | Escrita permitida |
|---|---|---|
| `VAL-W008-FULLSTACK-009` | `FULLSTACK_POST_W008_VALIDATION` | somente resultado; produto read-only |
| `STR-QA-FE-002` | `FRONTEND_COVERAGE_REFRESH` | testes frontend e seção frontend do baseline; produção read-only |
| `STR-SEC-IAM-001` | `IAM_CONTRACT_GUARD` | `scripts/security/iam/**`, inventário, fixtures, testes e resultado; produto/realm read-only |
| `STR-ARCH-BE-003` | `BACKEND_GLOBAL_SEARCH_BOUNDARY` | `common/search`, adapter/projeção `empresa`, testes e architecture baseline/allowlist |
| `STR-DOC-002` | `DOCUMENT_LOCAL_STORAGE_CONTRACTS` | storage local de documentos, testes focados e resultado; POM/migrations read-only |

## Independência

- o smoke escreve somente seu relatório;
- coverage é o único owner de testes/configuração de qualidade do frontend;
- IAM apenas lê segurança, controllers e realm do produto;
- busca global não toca segurança, documentos ou frontend;
- storage local não toca busca, IAM, frontend ou banco;
- a tranche arquitetural parte de 6 findings e deve remover exatamente 2;
- nenhum owner cria migration;
- nenhum owner depende de outro slot;
- nenhum owner usa provider real, credencial ou dado real;
- overlap descoberto torna o owner posterior `SUPERSEDED` ou serializado.

## Campanha reservada fora da wave

`VAL-QA-BE-DOCKER-001` possui owner somente de execução da suíte
`ExecucaoFilaPostgresqlTest` em ambiente Docker. Não altera código e não ocupa slot enquanto o
ambiente necessário não estiver disponível.

`OWNER_MATRIX_FAST_LANE_WAVE_009`
