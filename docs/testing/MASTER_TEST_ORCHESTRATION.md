# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`  
**Reconciliado em:** `2026-08-16`  
**Release HEAD observado:** `91a42c8e96775f2cbe3c09481beed879d4fbab31`

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

| ID | Owner | Baseline executado | Ambiente | Resultado | Classificação | Disposição |
|---|---|---|---|---|---|---|
| `VAL-STAB-FULLSTACK-001` | aplicação controlada | `4c07f16a...` ancestral da main atual | Linux + PostgreSQL + Chromium | backend/worker/frontend verdes; Flyway V12; 19 jornadas; zero externa/5xx | `PASS` | `REUSE_PASS` |
| `BUG-INFRA-001` | guard Docker | `4c07f16a...` | Node/Linux | falso positivo removido; 2 regressões verdes | `TEST_CONTRACT_DRIFT_FIXED` | `REUSE_PASS` |
| `VAL-STAB-BACKEND-PG-002` | backend + PostgreSQL | `4c07f16a...` | Linux + PostgreSQL 16.14 | 5 testes; 0 falhas/erros; Flyway V1–V12 | `PASS` | `REUSE_PASS` |
| `VAL-STAB-FRONTEND-NODE24-002` | frontend | `4c07f16a...` | Node 24.19 | i18n, typecheck, 20 testes e build verdes | `PASS` | `REUSE_PASS` |
| `VAL-STAB-WORKER-NODE24-PW-002` | worker/browser | `4c07f16a...` | Node 24.19 + Chromium 1223 | typecheck, 7 testes e build verdes; rede externa bloqueada | `PASS` | `REUSE_PASS` |
| `STR-ORQ-002` | migration registry | main integrada | Node/Linux | V1–V12, checksums, duplicata e retrocesso protegidos | `PASS` | `DONE` |
| `STR-RUN-001` | inventário Windows | main integrada | testes sintéticos PowerShell/schema | redaction e inventário aprovados, runtime não coletado | `PARTIAL_IMPLEMENTATION` | `FIX_PRODUCT: BUG-RUN-001` |

As provas específicas foram executadas em SHAs ancestrais, mas as integrações posteriores até
`91a42c8e96775f2cbe3c09481beed879d4fbab31` adicionaram predominantemente relatórios e tooling.
Nenhuma mudança posterior observada em backend, frontend ou worker invalida os owners verdes acima.
Antes de reuse futuro, comparar o delta por owner.

## Owners atuais

| Owner | Estado | Próxima prova necessária |
|---|---|---|
| backend compile/unit/integration | `GREEN_REUSABLE` | rerun somente após delta backend/dependência |
| frontend Node suportado | `GREEN_REUSABLE` | rerun somente após delta frontend/dependência |
| worker Node/Playwright | `GREEN_REUSABLE` | rerun somente após delta worker/dependência/browser |
| Flyway V1–V12 controlado | `GREEN_REUSABLE` | validar novo frontier quando houver migration |
| contrato Docker estático | `GREEN_REUSABLE` | rerun após alteração de startup/deploy/guard |
| startup Windows dev | `NOT_PROVEN` | após `FIX-STARTUP-MAIN-001` |
| segundo startup/reuso PostgreSQL | `NOT_PROVEN` | campanha Windows dev |
| on-premise/Keycloak | `NOT_PROVEN` | somente após dev verde |
| coletor runtime Windows | `INCOMPLETE` | `BUG-RUN-001` |
| coverage agregado | `NOT_MEASURED` | campanha futura `STR-QA-001` |
| providers reais | `NOT_AUTHORIZED_NOT_REQUIRED` | não executar |

## Wave 002

`CONTABILIDADE_STABILIZATION_WAVE_002` está `CONSUMED`.

Resultados:

- `BUG-INFRA-001`: `PASS`;
- `VAL-STAB-BACKEND-PG-002`: `PASS`;
- `VAL-STAB-FRONTEND-NODE24-002`: `PASS`;
- `VAL-STAB-WORKER-NODE24-PW-002`: `PASS`.

Não há successor de correção para backend/frontend/worker. Avisos de chunk, `allowScripts`,
configuração npm obsoleta e futuro Byte Buddy permanecem backlog técnico, não blockers desta
estabilização.

## Wave 003

`PREPARED_NOT_RELEASED`. Ela implementa o caminho real de startup, completa a coleta Windows e
fecha lacunas estruturais de wave/version/ownership sem repetir a campanha Cloud.

## Campanha Windows após startup

Quando `FIX-STARTUP-MAIN-001` estiver integrado:

1. executar `START_CONTABILIDADE.bat dev`;
2. coletar evidência por `BUG-RUN-001`;
3. provar somente PostgreSQL, backend, worker e frontend no modo dev;
4. provar health/readiness, Flyway V12 e ausência de Keycloak/bootstrap;
5. executar segunda inicialização e provar reuso do PostgreSQL/volumes;
6. classificar qualquer falha antes de selecionar correção;
7. só depois executar on-premise + Keycloak.

## Invalidação

Uma evidência `REUSE_PASS` é invalidada apenas por mudança material em:

- código/testes/dependências do owner;
- runtime mínimo suportado;
- migration frontier;
- contrato de segurança/ambiente;
- comando ou fixture que produziu a prova.

Mudanças apenas documentais não invalidam prova de aplicação.

`MASTER_TEST_ORCHESTRATION_WAVE_002_CONSUMED`
