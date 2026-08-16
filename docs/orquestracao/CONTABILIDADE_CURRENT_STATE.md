# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`
**Reconciliado em:** `2026-08-16`
**Branch de integração:** `main`
**HEAD atual verificado:** `4c07f16a8a66abb76983c9203c8e694c748f0af0`
**Baseline de aplicação validada no Cloud:** `7c6079caa54d1e7526a3e03c5ee41893581ff9b1`
**Versão declarada:** `0.5.1`
**Frontier Flyway observado:** `V12`
**PRs abertas:** `#56`, `#57`
**Modo:** `CLOUD_CORE_PROVEN_WINDOWS_PENDING`

## Verdade de integração

- As PRs `#58` a `#64` foram integradas após o baseline de aplicação `7c6079c`.
- `#58`, `#59`, `#60`, `#62` e `#64` adicionaram resultados de validação.
- `#61` adicionou registry/guard de migrations e `#63` adicionou o coletor de evidência Windows.
- Esse delta não alterou código funcional da aplicação nem migrations SQL; portanto, a prova full-stack
  de `7c6079c` permanece reutilizável para o runtime de aplicação presente no HEAD atual.
- A PR `#56` continua aberta e contém a correção de startup dev/on-premise.
- A PR `#57` continua aberta e contém esta governança v2; enquanto não for integrada, os launchers
  v2 permanecem preparados, não liberados.

## Disposição das evidências

| Evidência | Resultado | Classificação | Disposição |
|---|---|---|---|
| `VAL-STAB-FULLSTACK-001` | backend, worker, frontend, Flyway V12, heartbeat e 19 jornadas verdes | `PASS_WITH_ENVIRONMENT_LIMITATION` | `REUSE_PASS_WITH_LIMITATION`; Node 20 abaixo do contrato |
| `VAL-STAB-FRONTEND-001` | i18n, typecheck, 20 testes e build verdes | `PASS_WITH_ENVIRONMENT_LIMITATION` | rerun somente em Node suportado |
| `VAL-STAB-BACKEND-001` | erro de conexão com PostgreSQL ausente | `ENVIRONMENT_LIMITATION` | runtime supersedido pela prova full-stack; verify focado com PostgreSQL ainda selecionável |
| `VAL-STAB-WORKER-001` | typecheck e seis testes verdes; browser ausente | `ENVIRONMENT_LIMITATION` | browser runtime supersedido pelo full-stack; suíte completa em Node suportado ainda selecionável |
| `VAL-STAB-INFRA-CONTRACT-001` | guard falhou em texto descritivo; pwsh/docker ausentes | `TEST_CONTRACT_DRIFT` + `ENVIRONMENT_LIMITATION` | corrigir somente o guard e repetir prova focada |

## O que está comprovado

- aplicação full-stack sobe em ambiente Linux controlado;
- PostgreSQL, Flyway V1–V12, backend, worker e frontend comunicam-se;
- endpoints de saúde e proxy respondem HTTP 200;
- heartbeat é persistido;
- smoke Playwright percorre 19 jornadas com dados sintéticos;
- zero chamada externa e zero HTTP 5xx foram observados na campanha full-stack;
- registry monotônico de migrations V1–V12 está integrado;
- coletor seguro de evidência Windows está integrado.

## O que não está comprovado

- `START_CONTABILIDADE.bat dev` no Windows/Docker Desktop;
- reutilização real do PostgreSQL no segundo startup Windows;
- startup on-premise com bootstrap, Keycloak e login;
- Compose efetivo em Docker Desktop;
- frontend/worker sob Node oficialmente suportado;
- coverage agregado atual.

## Ondas

- `PREPARED_NOT_RELEASED`: `CONTABILIDADE_STABILIZATION_WAVE_002`;
- `RELEASED_FOR_EXECUTION`: nenhuma;
- migration owner aberto: nenhum;
- Windows campaign: `NOT_EXECUTED_BY_USER`.

### Gates de liberação da Wave 002

1. integrar ou encerrar a PR `#56`;
2. integrar a PR `#57`;
3. atualizar uma vez o delta até o novo HEAD;
4. confirmar ausência de owner concorrente nos quatro itens preparados;
5. publicar os launchers exatos somente depois dessa verificação.

## Estado estrutural

- `STR-ORQ-002`: `DONE`;
- `STR-RUN-001`: `IMPLEMENTED_PENDING_WINDOWS_EXECUTION`;
- `STR-TEST-001`: `DONE_BY_RECONCILIATION`;
- `STR-ORQ-001`: pendente;
- `STR-ORQ-003`: pronto para onda estrutural posterior;
- `STR-OWN-001`: pronto para onda estrutural posterior.

## Próxima transição

Liberar a Wave 002 após os gates acima. Depois, executar a campanha Windows dev com o coletor
integrado. O on-premise/Keycloak só é promovido após o dev ficar verde.

`CONTABILIDADE_CURRENT_STATE_AFTER_PR64_WAVE002_PREPARED`
