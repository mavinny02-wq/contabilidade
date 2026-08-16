# Contabilidade Stabilization Wave 003

**Classificação:** `CANONICAL_RELEASED_WAVE`  
**Status:** `RELEASED_FOR_EXECUTION`  
**Baseline comum:** `main@659ff87e4344cab235d87a443ea9ddb310fe03d5`  
**Owners executáveis:** `5`  
**Migration owner:** `NONE`

## Trigger e gates

A solicitação explícita do usuário para calcular a próxima wave autorizou a reconciliação e a
liberação após conclusão da Wave 002.

Gates comprovados:

- fundação v2 integrada;
- PR antiga de startup encerrada sem merge como `SUPERSEDED`;
- fila de PRs aberta vazia antes da liberação;
- HEAD atualizado;
- owner matrix revisada;
- cinco owners independentes;
- nenhum novo delta funcional invalidou backend, frontend, worker, Flyway ou full-stack.

## Evidência reutilizada

- full-stack controlado: `REUSE_PASS`;
- backend + PostgreSQL: `REUSE_PASS`;
- frontend Node 24: `REUSE_PASS`;
- worker Node 24 + Chromium: `REUSE_PASS`;
- guard Docker: `REUSE_PASS`;
- registry Flyway V1–V12: `DONE`.

A wave não repete essas provas de forma ampla.

## Owners oficiais

| Slot | ITEM | Owner exclusivo | RESULT_MD |
|---:|---|---|---|
| 1 | `FIX-STARTUP-MAIN-001` | `STARTUP_DEPLOY` | `docs/implementacao/FIX_STARTUP_MAIN_001_RESULT.md` |
| 2 | `BUG-RUN-001` | `WINDOWS_EVIDENCE` | `docs/implementacao/BUG_RUN_001_RESULT.md` |
| 3 | `STR-ORQ-003` | `WAVE_MANIFESTS` | `docs/implementacao/STR_ORQ_003_RESULT.md` |
| 4 | `STR-REL-001` | `VERSION_RELEASE` | `docs/implementacao/STR_REL_001_RESULT.md` |
| 5 | `STR-OWN-001` | `CODEOWNERS_HOTSPOTS` | `docs/implementacao/STR_OWN_001_RESULT.md` |

## Ownership

### `FIX-STARTUP-MAIN-001`

Reaplica somente o comportamento desejado da PR superseded sobre a latest main. Preserva o guard
Docker corrigido, migration governance e evidências já integradas. É o único owner de startup,
Compose e `.github/workflows/build.yml`.

### `BUG-RUN-001`

Completa o coletor Windows com runtime, containers, health, Flyway, endpoints e segundo startup.
Não altera startup, Compose, aplicação ou banco.

### `STR-ORQ-003`

Implementa schema, validator, fixtures, testes e workflow próprio do lifecycle de waves. Não altera
esta wave liberada nem os documentos de estado durante a execução.

### `STR-REL-001`

Implementa leitura/guard de consistência de versão e release sem realizar bump.

### `STR-OWN-001`

Cria CODEOWNERS somente com identidades GitHub confirmadas e paths críticos. Branch protection fica
para ação posterior.

## Política comum

- iniciar da baseline comum e atualizar apenas conforme regra do launcher;
- uma branch e uma PR por owner;
- nenhuma migration;
- sem provider fiscal real, chamada paga, credencial ou dado real;
- sem bypass de CAPTCHA/MFA/anti-bot;
- testes proporcionais ao owner;
- não alterar current state, ledger, backlog ou manifest desta wave;
- resultado final deve informar ITEM, STATUS, RESULT_MD e COMMIT/PR.

## Launcher pack

`docs/orquestracao/waves/released/CONTABILIDADE_STABILIZATION_WAVE_003_LAUNCHERS.txt`

## Após os resultados

O orquestrador integrará/reconciliará os resultados. A próxima ação prevista é a campanha manual
Windows dev; on-premise + Keycloak só ocorre depois do modo dev verde.

`CONTABILIDADE_STABILIZATION_WAVE_003_RELEASED`
