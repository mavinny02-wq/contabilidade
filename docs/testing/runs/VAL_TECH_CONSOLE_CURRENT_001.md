# VAL-TECH-CONSOLE-CURRENT-001 — Console Técnica atual

- **ITEM:** `VAL-TECH-CONSOLE-CURRENT-001`
- **CONTRACT:** `2.0`
- **WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_010`
- **DISPATCH_KEY:** `79d1de1e00ff7224dbccba207995d97c25a4e1f3d1353a3c5daea4e647e8f45d`
- **Baseline verificada:** `507a096` (`docs(orchestration): consume Wave 009 and release Fast Lane 010`)
- **Status:** `PRODUCT_REGRESSION`
- **Owner:** testes focados backend/frontend da Console Técnica atual; produto permaneceu read-only
- **Migration:** `NONE`

## Escopo e owners alterados

Foram adicionadas somente provas automatizadas e esta evidência:

- backend: classificação de heartbeat sem registro, atrasado, expirado e saudável;
- backend: reconciliação de storage saudável, divergente e parcial;
- backend HTTP: autorização permitida e negada na rota atual;
- backend PostgreSQL HTTP: resumo, configuração sem segredos e período bounded do histórico;
- frontend: loading, retry, erro 500 seguro com correlation ID e reconciliação divergente;
- contratos: alinhamento do call site com usage map e OpenAPI.

Nenhum arquivo de produção, migration, `pom.xml`, lockfile ou snapshot contratual foi alterado. Nenhum request para `/api/system/**` ou `/api/technical/**` foi introduzido.

## Classificação

### `PRODUCT_REGRESSION` — autorização negada resulta em HTTP 500

A prova `ConsoleTecnicaAuthorizationTest.negaUsuarioSemAutoridadeDaConsoleTecnica` esperava `403`, mas recebeu `500` na rota atual `GET /api/console-tecnica/resumo`. O stack trace focado mostra `AccessDeniedException` originada por `AuthorizationManagerBeforeMethodInterceptor`; a exceção chega a `TratadorGlobalExcecoes.tratarInesperado`, que a converte em `ERRO_INTERNO`/500. A autorização permitida passa com `CONSOLE_TECNICA_LER`.

A task é product read-only, portanto não corrige o handler global nem altera o controller. O teste regressivo permanece com a expectativa contratual `403` para tornar a falha reproduzível.

### `ENVIRONMENT_LIMITATION` — PostgreSQL controlado

O teste HTTP/PostgreSQL foi compilado, mas não executou neste executor porque Testcontainers não encontrou um ambiente Docker válido (`Could not find a valid Docker environment`). Não foram usadas credenciais nem banco externo real para contornar a limitação.

## Comandos e resultados

| Comando | Resultado | Classificação |
|---|---|---|
| `cd backend && mvn -B -DskipTests test-compile` | `BUILD SUCCESS` com Java `21.0.2` | `PASS` |
| `cd backend && mvn -q -Dtest=WorkerHeartbeatStatusServiceTest,StorageReconciliacaoServiceTest test` | 2 testes passam | `PASS` |
| `cd backend && mvn -q -Dtest=ConsoleTecnicaAuthorizationTest test` | permitido passa; negado espera 403 e recebe 500 | `PRODUCT_REGRESSION` |
| `cd backend && mvn -q -Dtest=BancoPostgresqlIntegracaoTest test` | Testcontainers sem Docker válido | `ENVIRONMENT_LIMITATION` |
| `cd frontend && nvm use 24 && npm ci --no-audit --no-fund` | Node `v24.19.0`; instalação locked concluída | `PASS` |
| `cd frontend && nvm use 24 && npm test -- --run src/pages/ConsoleTecnicaPage.test.tsx` | 2 testes passam | `PASS` |
| `cd frontend && nvm use 24 && npm run locale:validate && npm run typecheck && npm run build` | locale, typecheck e build passam | `PASS` |
| `python3 scripts/contracts/consumer_contract_guard.py --frontend frontend/src --usage contracts/openapi/frontend-usage.json --openapi contracts/openapi/openapi.json` | `CONSUMER_CONTRACT_OK` | `PASS` |
| `python3 scripts/contracts/test_openapi_guard.py` | 8 testes passam | `PASS` |
| `python3 scripts/contracts/openapi_guard.py check --baseline contracts/openapi/openapi.json --candidate contracts/openapi/openapi.json --usage-map contracts/openapi/frontend-usage.json` | `OPENAPI_COMPATIBILITY_OK` | `PASS` |
| `git diff --check` | sem erros | `PASS` |
| `rg -n '/api/(system|technical)/' backend/src/test frontend/src/pages/ConsoleTecnicaPage.test.tsx` | nenhuma ocorrência | `PASS` |

## Locks preservados

- `LOCK-DATA-001`: somente fixtures sintéticas; nenhum dado, segredo ou credencial real.
- `LOCK-EVID-001`: reruns focados; a limitação Docker foi registrada sem alegar prova PostgreSQL.
- `LOCK-TEST-001`: a falha de autorização foi classificada antes de qualquer mudança; produção permaneceu intocada.

## Limitações e provas pendentes

1. Corrigir em owner de produto o mapeamento de `AccessDeniedException` para 403 e então rerodar `ConsoleTecnicaAuthorizationTest`.
2. Rerodar `BancoPostgresqlIntegracaoTest` em executor com Docker/Testcontainers ou PostgreSQL de campanha explicitamente autorizado.

## Commit e PR

- **Commit de implementação:** `f1f23f82a3c2026feb28e9435b5944f7c4887e0d`.
- **PR:** `NOT_CREATED_MAKE_PR_UNAVAILABLE` — o ambiente não expõe a ferramenta `make_pr`, o checkout não possui remote e o GitHub CLI não está autenticado.
