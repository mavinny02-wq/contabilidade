# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`
**Reconciliado em:** `2026-08-16`
**HEAD observado:** `4c07f16a8a66abb76983c9203c8e694c748f0af0`

Este ledger agenda, classifica e reutiliza evidência. Não é uma lista para executar tudo sempre.

## Política

- validação executa apenas owner explicitamente liberado;
- produção não é alterada para tornar teste verde;
- Cloud Linux e Windows/Docker Desktop são ambientes distintos;
- provider real/pago não é executado sem autorização;
- `REUSE_PASS` precede rerun;
- rerun é focado na lacuna ainda não comprovada;
- coverage só é declarado quando realmente medido no mesmo baseline.

## Evidência reconciliada

| ID | Baseline de código | Ambiente | Resultado | Classificação | Disposição |
|---|---|---|---|---|---|
| `VAL-STAB-FULLSTACK-001` | `7c6079c` | Linux, Java 21, PostgreSQL 16, Node 20, Chromium | PASS | `PASS_WITH_ENVIRONMENT_LIMITATION` | `REUSE_PASS_WITH_LIMITATION` |
| `VAL-STAB-FRONTEND-001` | `7c6079c` | Linux, Node 20 | PASS | `PASS_WITH_ENVIRONMENT_LIMITATION` | `RERUN_FOCUSED_SUPPORTED_NODE` |
| `VAL-STAB-BACKEND-001` | `7c6079c` | Linux sem PostgreSQL | ERROR | `ENVIRONMENT_LIMITATION` | `RERUN_FOCUSED_WITH_POSTGRESQL` |
| `VAL-STAB-WORKER-001` | `7c6079c` | Linux, Node 20, sem Chromium | PARTIAL | `ENVIRONMENT_LIMITATION` | `RERUN_FOCUSED_SUPPORTED_NODE_AND_BROWSER` |
| `VAL-STAB-INFRA-CONTRACT-001` | `7c6079c` | Linux sem pwsh/docker | FAIL/PARTIAL | `TEST_CONTRACT_DRIFT` + `ENVIRONMENT_LIMITATION` | `FIX_TEST_CONTRACT_THEN_RERUN_FOCUSED` |
| `STR-ORQ-002` | PR `#61` | Node | PASS | `STRUCTURAL_GUARD_PASS` | `REUSE_PASS` |
| `STR-RUN-001` | PR `#63` | Cloud tests | PASS | `TOOLING_IMPLEMENTED` | `WAITING_FOR_WINDOWS_EVIDENCE` |

## Autoridade da prova full-stack

A campanha full-stack comprovou:

- backend readiness e liveness;
- worker health;
- frontend e proxy para backend;
- Flyway com última migration `12:true`;
- heartbeat persistido;
- 19 jornadas Playwright;
- zero chamada externa;
- zero HTTP 5xx nos logs coletados.

As PRs `#58` a `#64` não alteraram código funcional da aplicação nem migrations SQL. Assim, essa
prova pode ser reutilizada para o runtime de aplicação do HEAD atual. Ela não prova Windows,
Docker Desktop, Keycloak on-premise nem paridade Node 22.12+/24.

## Classificação das aparentes falhas

### Backend isolado

A falha `Connection refused` em `127.0.0.1:5432` não prova regressão do backend. É
`ENVIRONMENT_LIMITATION`. A prova full-stack posterior demonstrou backend e Flyway funcionando com
PostgreSQL. Resta somente repetir `mvn clean verify` em ambiente preparado para fechar o owner da
suíte isolada.

### Worker isolado

A ausência do executável Chromium não prova regressão do worker. É `ENVIRONMENT_LIMITATION`. O
full-stack posterior instalou Chromium e aprovou browser smoke; resta a suíte completa em Node
suportado.

### Contrato de infraestrutura

O guard interpretou uma mensagem descritiva contendo `Docker build` como execução de comando. Isso
é `TEST_CONTRACT_DRIFT`. A correção deve restringir a detecção a invocações executáveis e adicionar
regressão positiva/negativa antes do rerun.

## Matriz atual

| Owner | Estado | Próxima prova |
|---|---|---|
| full-stack Cloud | `REUSE_PASS_WITH_LIMITATION` | nenhuma repetição ampla |
| backend verify | `RERUN_FOCUSED` | PostgreSQL controlado |
| frontend | `RERUN_FOCUSED` | Node 24 |
| worker | `RERUN_FOCUSED` | Node 24 + Chromium Playwright |
| infra contract | `FIX_TEST_CONTRACT` | guard + rerun focado |
| Flyway registry | `REUSE_PASS` | apenas quando migrations mudarem |
| Windows dev | `NO_PROOF` | execução manual com coletor |
| Windows on-premise/Keycloak | `NO_PROOF` | somente após dev verde |
| external providers | `NOT_AUTHORIZED_NOT_REQUIRED` | não executar |
| aggregate coverage | `NOT_MEASURED` | campanha posterior |

## Próxima campanha preparada

`docs/orquestracao/waves/prepared/CONTABILIDADE_STABILIZATION_WAVE_002.md`

Ela contém quatro owners, nenhuma migration e nenhum rerun amplo. Continua
`PREPARED_NOT_RELEASED` até a integração das PRs abertas e refresh do HEAD.
