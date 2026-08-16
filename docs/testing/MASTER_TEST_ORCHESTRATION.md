# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`  
**Reconciliado em:** `2026-08-16`  
**Release HEAD:** `659ff87e4344cab235d87a443ea9ddb310fe03d5`

Este ledger classifica e reutiliza evidência. Não agenda rerun amplo sem invalidação comprovada.

## Política

- cada prova tem owner, baseline, ambiente, resultado, validade e disposição;
- falha ambiental não é regressão de produto;
- produção não é alterada para satisfazer teste incorreto;
- Cloud Linux e Windows/Docker Desktop são evidências distintas;
- provider real/pago não participa de validação comum;
- evidência verde é reutilizada até mudança material no owner;
- coverage agregado só existe quando medido no mesmo baseline.

## Evidência integrada

| ID | Owner | Ambiente | Resultado | Classificação | Disposição |
|---|---|---|---|---|---|
| `VAL-STAB-FULLSTACK-001` | aplicação controlada | Linux + PostgreSQL + Chromium | backend/worker/frontend verdes; Flyway V12; 19 jornadas; zero externa/5xx | `PASS` | `REUSE_PASS` |
| `BUG-INFRA-001` | guard Docker | Node/Linux | falso positivo removido; regressões verdes | `TEST_CONTRACT_DRIFT_FIXED` | `REUSE_PASS` |
| `VAL-STAB-BACKEND-PG-002` | backend + PostgreSQL | Linux + PostgreSQL 16.14 | 5 testes; 0 falhas/erros; Flyway V1–V12 | `PASS` | `REUSE_PASS` |
| `VAL-STAB-FRONTEND-NODE24-002` | frontend | Node 24.19 | i18n, typecheck, 20 testes e build verdes | `PASS` | `REUSE_PASS` |
| `VAL-STAB-WORKER-NODE24-PW-002` | worker/browser | Node 24.19 + Chromium 1223 | typecheck, 7 testes e build verdes | `PASS` | `REUSE_PASS` |
| `STR-ORQ-002` | migration registry | Node/Linux | V1–V12, checksums, duplicata e retrocesso protegidos | `PASS` | `DONE` |
| `STR-RUN-001` | inventário Windows | PowerShell/schema sintético | redaction e inventário aprovados; runtime não coletado | `PARTIAL_IMPLEMENTATION` | `FIX_PRODUCT: BUG-RUN-001` |

As integrações posteriores aos SHAs de execução adicionaram principalmente relatórios e tooling. O
delta observado não invalida backend, frontend, worker ou Flyway. Reuse futuro ainda deve comparar o
owner afetado.

## Owners atuais

| Owner | Estado | Próxima prova necessária |
|---|---|---|
| backend compile/unit/integration | `GREEN_REUSABLE` | rerun apenas após delta backend/dependência |
| frontend Node suportado | `GREEN_REUSABLE` | rerun apenas após delta frontend/dependência |
| worker Node/Playwright | `GREEN_REUSABLE` | rerun apenas após delta worker/dependência/browser |
| Flyway V1–V12 controlado | `GREEN_REUSABLE` | validar novo frontier quando houver migration |
| contrato Docker estático | `GREEN_REUSABLE` | rerun após alteração de startup/deploy/guard |
| startup Windows dev | `NOT_PROVEN` | após `FIX-STARTUP-MAIN-001` |
| segundo startup/reuso PostgreSQL | `NOT_PROVEN` | campanha Windows dev |
| on-premise/Keycloak | `NOT_PROVEN` | somente após dev verde |
| coletor runtime Windows | `INCOMPLETE` | `BUG-RUN-001` |
| coverage agregado | `NOT_MEASURED` | campanha futura `STR-QA-001` |
| providers reais | `NOT_AUTHORIZED_NOT_REQUIRED` | não executar |

## Wave 002

`CONTABILIDADE_STABILIZATION_WAVE_002` está `CONSUMED` com quatro resultados verdes. Ela não pode
ser relançada.

## Wave 003

`CONTABILIDADE_STABILIZATION_WAVE_003` está `RELEASED_FOR_EXECUTION`.

Ela não repete a campanha Cloud. Seus owners corrigem o caminho oficial de startup, completam a
coleta Windows e implantam controles de lifecycle, versão e ownership.

## Campanha Windows após integração da wave

1. executar `START_CONTABILIDADE.bat dev`;
2. coletar evidência pelo coletor corrigido;
3. provar somente PostgreSQL, backend, worker e frontend no modo dev;
4. provar health/readiness, Flyway V12 e ausência de Keycloak/bootstrap;
5. executar segunda inicialização e provar reuso do PostgreSQL/volumes;
6. classificar qualquer falha antes de selecionar correção;
7. só depois executar on-premise + Keycloak.

## Invalidação

Uma evidência `REUSE_PASS` é invalidada apenas por mudança material em código, teste, dependência,
runtime suportado, migration frontier, contrato de segurança ou fixture do owner. Mudanças apenas
documentais não invalidam prova de aplicação.

`MASTER_TEST_ORCHESTRATION_WAVE_003_RELEASED`
