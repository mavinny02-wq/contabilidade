# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`
**Reconciliado em:** `2026-08-16`
**Branch de integração:** `main`
**HEAD reconciliado antes da liberação documental:** `76258506f63777a228980b030857db1cefd89a43`
**Versão declarada:** `0.5.1`
**Frontier Flyway:** `V12`
**Modo:** `MATURITY_WAVE_004_RELEASED`

## Verdade de integração

- A Wave 003 foi integrada pelas PRs `#71`, `#72`, `#74`, `#75` e `#76`.
- A PR `#73` era uma execução duplicada de `STR-ORQ-003` e foi encerrada sem merge como
  `SUPERSEDED_DUPLICATE_OWNER`.
- Fila de PRs aberta após a reconciliação: nenhuma.
- Nenhum owner de migration está aberto.
- A `main` continua sem branch protection/ruleset obrigatório.

## Resultado da Wave 003

| ITEM | Resultado | Disposição |
|---|---|---|
| `FIX-STARTUP-MAIN-001` | startup oficial reaplicado; guards verdes; Windows/Docker pendente | `PASS_WITH_ENVIRONMENT_LIMITATION` |
| `BUG-RUN-001` | coletor v2, schema, redaction e 9 testes simulados verdes | `IMPLEMENTED_AWAITING_LOCAL_WINDOWS_MANUAL` |
| `STR-ORQ-003` | schema/validator de lifecycle; 6 testes; governance guard verde | `DONE` |
| `STR-REL-001` | `VERSION` canônica; guard e 6 testes de drift | `DONE` |
| `STR-OWN-001` | CODEOWNERS com maintainer confirmado e hotspots | `DONE` |

A integração foi somente de startup/tooling/governança. Ela não invalida as provas verdes de
backend, frontend, worker, Flyway e full-stack controlado, exceto o contrato estático de startup,
que foi revalidado dentro de `FIX-STARTUP-MAIN-001`.

## Estado de validação

```text
CORE_APPLICATION_CLOUD: GREEN_REUSABLE
BACKEND_POSTGRESQL: GREEN_REUSABLE
FRONTEND_NODE24: GREEN_REUSABLE
WORKER_NODE24_PLAYWRIGHT: GREEN_REUSABLE
FLYWAY_V1_V12_CONTROLLED_POSTGRESQL: GREEN_REUSABLE
STARTUP_DOCKER_CONTRACT_STATIC: GREEN
WINDOWS_DEV_DOCKER_DESKTOP: NOT_PROVEN
WINDOWS_SECOND_START_REUSE: NOT_PROVEN
ONPREMISE_KEYCLOAK_LOGIN: BLOCKED_UNTIL_DEV_GREEN
AGGREGATE_COVERAGE: NOT_MEASURED
REAL_EXTERNAL_PROVIDERS: NOT_AUTHORIZED_NOT_REQUIRED
```

## Campanha humana paralela

A prova Windows dev está pronta para execução manual e não consome slot Codex:

1. atualizar `main`;
2. executar `START_CONTABILIDADE.bat dev`;
3. executar o coletor v2 em modo `dev`;
4. repetir o startup e coletar com o estado anterior;
5. reconciliar somente a evidência segura.

On-premise + Keycloak permanece bloqueado até o modo dev ficar verde.

## Ondas

- `CONTABILIDADE_STABILIZATION_WAVE_002`: `CONSUMED`;
- `CONTABILIDADE_STABILIZATION_WAVE_003`: `CONSUMED`;
- `CONTABILIDADE_MATURITY_WAVE_004`: `RELEASED_FOR_EXECUTION`;
- owners executáveis liberados: `5`;
- migration owner: `NONE`.

## Wave 004 liberada

1. `BUG-ORQ-001` — impedir dispatch/PR duplicado por chave idempotente;
2. `STR-SEC-001` — guard local de segredos/PII com redaction e allowlist governada;
3. `STR-DEP-001` — SBOM, licenças, advisory scan e exceções expiráveis;
4. `STR-DB-001` — PostgreSQL 17 reproduzível com Testcontainers;
5. `STR-WRK-001` — regressões de lease/retry/idempotência/shutdown.

Os owners são independentes, não criam migration e não repetem a campanha full-stack ampla.

## Próxima transição

Integrar e reconciliar os cinco resultados. Depois:

- criar o required CI gate sobre as lanes estabilizadas;
- habilitar branch protection/ruleset;
- medir coverage real;
- validar Windows dev e, quando verde, on-premise + Keycloak.

`CONTABILIDADE_CURRENT_STATE_WAVE_004_RELEASED`
