# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`  
**Reconciliado em:** `2026-08-16`  
**Branch de integração:** `main`  
**HEAD de liberação:** `659ff87e4344cab235d87a443ea9ddb310fe03d5`  
**Versão declarada:** `0.5.1`  
**Frontier Flyway:** `V12`  
**Modo:** `STABILIZATION_WAVE_003_RELEASED`

## Verdade de integração

- A fundação de orquestração v2 foi integrada pela PR `#57`.
- A antiga PR de startup `#56` foi encerrada sem merge como `SUPERSEDED`.
- **PR aberta na verificação anterior à liberação:** nenhuma.
- O HEAD de liberação contém os resultados integrados das PRs `#58` a `#68`.
- Nenhum owner de migration está aberto.

## Evidência reutilizada

| Owner | Evidência | Resultado | Disposição |
|---|---|---|---|
| aplicação full-stack controlada | `VAL-STAB-FULLSTACK-001` | saúde, Flyway V12, heartbeat, 19 jornadas e zero chamadas externas | `REUSE_PASS` |
| backend + PostgreSQL | `VAL-STAB-BACKEND-PG-002` | 5 testes, 0 falhas/erros, `BUILD SUCCESS` | `REUSE_PASS` |
| frontend Node 24 | `VAL-STAB-FRONTEND-NODE24-002` | i18n, typecheck, 20 testes e build verdes | `REUSE_PASS` |
| worker Node 24 + Chromium | `VAL-STAB-WORKER-NODE24-PW-002` | typecheck, 7 testes, smoke local e build verdes | `REUSE_PASS` |
| contrato Docker | `BUG-INFRA-001` | falso positivo corrigido; comandos reais continuam bloqueados | `REUSE_PASS` |
| migrations | `STR-ORQ-002` | registry V1–V12, checksum, ordem e retrocesso protegidos | `DONE` |

Não repetir backend, frontend, worker ou full-stack sem mudança material no respectivo owner.

## Gap preservado

`STR-RUN-001` foi integrado parcialmente. O coletor atual registra ferramentas, Git, Docker/Compose,
WSL e redaction, mas ainda não registra:

- Compose efetivo;
- containers e health;
- Flyway;
- endpoints técnicos;
- ausência de Keycloak/bootstrap em dev;
- comparação de container IDs no segundo startup.

O successor exato é `BUG-RUN-001`.

## Estado de validação

```text
CORE_APPLICATION_CLOUD: GREEN
BACKEND_POSTGRESQL: GREEN
FRONTEND_NODE24: GREEN
WORKER_NODE24_PLAYWRIGHT: GREEN
FLYWAY_V1_V12_CONTROLLED_POSTGRESQL: GREEN
DOCKER_CONTRACT_STATIC: GREEN
WINDOWS_DEV_DOCKER_DESKTOP: NOT_PROVEN
WINDOWS_SECOND_START_REUSE: NOT_PROVEN
ONPREMISE_KEYCLOAK_LOGIN: NOT_PROVEN
AGGREGATE_COVERAGE: NOT_MEASURED
REAL_EXTERNAL_PROVIDERS: NOT_AUTHORIZED_NOT_REQUIRED
```

## Ondas

- `CONTABILIDADE_STABILIZATION_WAVE_002`: `CONSUMED`;
- `CONTABILIDADE_STABILIZATION_WAVE_003`: `RELEASED_FOR_EXECUTION`;
- owners executáveis liberados: `5`;
- migration owner: `NONE`;
- launcher pack: `docs/orquestracao/waves/released/CONTABILIDADE_STABILIZATION_WAVE_003_LAUNCHERS.txt`.

## Wave 003 liberada

1. `FIX-STARTUP-MAIN-001` — sucessor limpo da PR `#56` sobre a latest main;
2. `BUG-RUN-001` — completar a evidência Windows de runtime;
3. `STR-ORQ-003` — manifests e lifecycle determinísticos;
4. `STR-REL-001` — governança de versão e release;
5. `STR-OWN-001` — CODEOWNERS e hotspots com identidades reais.

Os cinco owners são independentes, partem do mesmo baseline e não criam migration.

## Locks ativos

- GitHub é a verdade de integração;
- sem push direto na `main`;
- até cinco owners, sem filler;
- no máximo um owner de migration;
- sem dependência same-wave;
- provider real/pago negado por padrão;
- sem credencial/dado real em automação;
- sem bypass de CAPTCHA/MFA/anti-bot;
- Cloud não substitui Windows;
- falhas são classificadas antes de alterar produção;
- evidência válida é reutilizada.

## Próxima transição

Integrar os resultados da Wave 003, reconciliar os owners e executar a campanha manual Windows dev.
On-premise + Keycloak só será validado depois do modo dev ficar verde.

`CONTABILIDADE_CURRENT_STATE_WAVE_003_RELEASED`
