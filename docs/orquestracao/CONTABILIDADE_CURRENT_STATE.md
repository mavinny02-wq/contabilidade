# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`  
**Reconciliado em:** `2026-08-16`  
**Branch de integração:** `main`  
**HEAD verificado:** `91a42c8e96775f2cbe3c09481beed879d4fbab31`  
**Versão declarada:** `0.5.1`  
**Frontier Flyway:** `V12`  
**Modo:** `STABILIZATION_CLOUD_GREEN_WINDOWS_PENDING`

## Verdade de integração

A `main` contém as PRs de estabilização `#58` a `#68`, inclusive:

- correção do falso positivo do contrato Docker (`#65`);
- backend com PostgreSQL sintético e `mvn clean verify` verde (`#66`);
- frontend completo em Node.js 24 (`#67`);
- worker completo em Node.js 24 com Chromium/Playwright (`#68`).

PRs ainda abertas:

| PR | Owner | Estado |
|---:|---|---|
| `#56` | startup/dev/on-premise | `CONFLICTING / SUPERSESSION_REQUIRED` |
| `#57` | fundação de orquestração v2 | `MERGEABLE / READY_FOR_INTEGRATION` |

A PR `#56` não deve ser mergeada no estado atual: ela parte de uma baseline antiga e conflita com
alterações já integradas no guard Docker e no workflow de migrations. Seu comportamento desejado
será reaplicado por `FIX-STARTUP-MAIN-001` sobre a `main` atual.

## Evidência reconciliada

| Owner | Evidência | Resultado | Disposição |
|---|---|---|---|
| full-stack controlado | `VAL-STAB-FULLSTACK-001` | saúde, Flyway V12, heartbeat, 19 jornadas e zero chamadas externas | `REUSE_PASS` |
| backend + PostgreSQL | `VAL-STAB-BACKEND-PG-002` | 5 testes, 0 falhas/erros, `BUILD SUCCESS` | `REUSE_PASS` |
| frontend Node 24 | `VAL-STAB-FRONTEND-NODE24-002` | i18n, typecheck, 20 testes e build verdes | `REUSE_PASS` |
| worker Node 24 + Chromium | `VAL-STAB-WORKER-NODE24-PW-002` | typecheck, 7 testes, smoke local e build verdes | `REUSE_PASS` |
| contrato Docker | `BUG-INFRA-001` | falso positivo corrigido; comandos reais continuam bloqueados | `REUSE_PASS` |
| migrations | `STR-ORQ-002` | registry V1–V12 e guard de checksum/ordem integrados | `DONE` |
| coletor Windows | `STR-RUN-001` | inventário de ferramentas/repo integrado | `PARTIAL_CONTRACT_GAP` |

O resultado de `STR-RUN-001` não satisfaz todo o aceite original: o coletor atual não registra
Compose efetivo, containers/health, Flyway, endpoints nem smoke do runtime. O sucessor corretivo é
`BUG-RUN-001`.

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

A evidência Cloud atual é reutilizável enquanto código/dependências/contratos afetados não mudarem.
Não repetir o full-stack amplo para preencher uma wave.

## Ondas

- `CONTABILIDADE_STABILIZATION_WAVE_002`: `CONSUMED`;
- `CONTABILIDADE_STABILIZATION_WAVE_003`: `PREPARED_NOT_RELEASED`;
- migration owner aberto: `NONE`;
- próxima prova de ambiente: Windows dev após integração do startup corrigido.

## Wave 003 preparada

Owners candidatos, todos sem migration:

1. `FIX-STARTUP-MAIN-001`;
2. `BUG-RUN-001`;
3. `STR-ORQ-003`;
4. `STR-REL-001`;
5. `STR-OWN-001`.

A wave só pode ser liberada após:

1. integração da PR `#57`;
2. classificação/encerramento da PR `#56` como superseded ou atualização explícita do mesmo owner;
3. refresh do HEAD e da fila de PRs;
4. confirmação de que os cinco owners continuam sem sobreposição.

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

Integrar a fundação v2, liberar a Wave 003 com baseline atualizado e, após o merge do owner de
startup, executar a campanha manual Windows dev usando o coletor runtime corrigido.

`CONTABILIDADE_CURRENT_STATE_STABILIZATION_WAVE_003_PREPARED`
