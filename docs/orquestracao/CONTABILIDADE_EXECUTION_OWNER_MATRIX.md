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
| `ARCHITECTURE_BASELINE` | `scripts/architecture/baseline.json`, allowlist | um owner por onda |

## Fast Lane Wave 010

| ITEM | Owner exclusivo | Escrita permitida |
|---|---|---|
| `FIX-SEC-IAM-001` | `BACKEND_IAM_FAIL_CLOSED` | converter JWT, testes focados, inventário/guard IAM e resultado |
| `FIX-STARTUP-PREFLIGHT-001` | `WINDOWS_STARTUP_PARSE_PREFLIGHT` | preflight parser, testes/guard de startup e resultado |
| `VAL-TECH-CONSOLE-CURRENT-001` | `TECHNICAL_CONSOLE_CURRENT_CONTRACT_VALIDATION` | testes backend/frontend atuais e resultado; produto read-only |
| `STR-ARCH-BE-004` | `CERTIDAO_EMPRESA_QUERY_BOUNDARY` | porta Certidão, adapter Empresa, testes e baseline/allowlist |
| `STR-INF-001` | `ENVIRONMENT_CONTRACT_GUARD` | tooling/policy/fixtures/workflow de ambiente; configs read-only |

## Independência

- segurança JWT não toca startup, Certidão, Console Técnica ou configuração de ambientes;
- startup não altera Compose, produto ou segurança;
- validação da Console Técnica escreve apenas testes e resultado;
- architecture é o único owner de baseline/allowlist;
- environment guard cria tooling próprio e apenas lê configurações;
- nenhum owner cria migration;
- nenhum owner modifica POM/lockfile;
- nenhum owner usa provider, credencial ou dado real;
- overlap descoberto torna o owner posterior `SUPERSEDED` ou serializado.

## Campanhas reservadas fora da wave

- `VAL-QA-BE-DOCKER-001`: execução da suíte `ExecucaoFilaPostgresqlTest`;
- Windows dev/segundo startup;
- on-premise/Keycloak;
- settings do GitHub Actions e branch protection.

`OWNER_MATRIX_FAST_LANE_WAVE_010`
