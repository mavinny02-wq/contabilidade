# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`
**Reconciliado em:** `2026-08-16`
**Branch de integração:** `main`
**HEAD funcional reconciliado:** `357dd4b8827c0c9620d0dd7e8398bc3468418ff9`
**Versão declarada:** `0.5.1`
**Frontier Flyway:** `V12`
**Modo:** `FAST_LANE_WAVE_009_RELEASED`

## Verdade de integração

- A Fast Lane Wave 008 foi integrada pelas PRs `#103`, `#104`, `#105`, `#106` e `#107`.
- **PR aberta na reconciliação:** nenhuma.
- Nenhum owner de migration está aberto ou liberado.
- A `main` continua sem branch protection/ruleset obrigatório.
- Nenhum required check remoto foi observado no HEAD; isso permanece
  `GITHUB_ACTIONS_SETTINGS_OR_PERMISSION_BLOCKER`, não `PASS`.

## Resultado da Fast Lane Wave 008

| ITEM | Resultado | Disposição |
|---|---|---|
| `VAL-W007-FULLSTACK-008` | Node 24, Java 21, Flyway V1–V12, health, heartbeat, 19 jornadas, a11y e zero externa/5xx | `PASS` |
| `STR-QA-BE-001` | suíte PostgreSQL/Testcontainers criada e compilada; executor sem Docker | `DONE_RUNTIME_PROOF_PENDING` |
| `STR-OBS-002` | 7 SLOs, 15 alertas, métricas bounded, guard e runbook | `PASS_STRUCTURAL` |
| `STR-ARCH-002` | composition root isolado; 600 arestas e findings 10 → 6 | `PASS` |
| `STR-CTX-002` | budgets por classe, warning/breach e saídas determinísticas | `PASS` |

A Wave 008 está `CONSUMED`. A ausência de Docker em `STR-QA-BE-001` não revelou regressão do
produto e não bloqueia a próxima fast lane. A prova pendente foi separada como
`VAL-QA-BE-DOCKER-001`, fora dos slots até existir executor Java 21 + Docker conhecido.

## Evidência e validade

```text
POST_W007_FULLSTACK: PASS
DOCKER_ORCHESTRATION_GUARD: PASS_STRUCTURAL
FRONTEND_ACCESSIBILITY_BROWSER: PASS
BACKEND_CRITICAL_TEST_SUITE: IMPLEMENTED_COMPILED_RUNTIME_DOCKER_PENDING
OPERATIONAL_SLO_ALERTING: PASS_STRUCTURAL
WORKER_COMPOSITION_BOUNDARY: PASS_600_EDGES_6_FINDINGS
TASK_CLASS_TOKEN_BUDGETS: PASS

REQUIRED_CI_REMOTE: NOT_PROVEN_EXTERNAL_BLOCKER
BRANCH_PROTECTION: NOT_ENABLED
WINDOWS_DEV_DOCKER_DESKTOP: NOT_PROVEN
WINDOWS_SECOND_START_REUSE: NOT_PROVEN
ONPREMISE_KEYCLOAK_LOGIN: BLOCKED_UNTIL_DEV_GREEN
REAL_EXTERNAL_PROVIDERS: NOT_AUTHORIZED_NOT_REQUIRED
```

## Fast Lane Wave 009

1. `VAL-W008-FULLSTACK-009` — smoke consolidado pós-Wave 008, produto read-only;
2. `STR-QA-FE-002` — coverage frontend pós-lazy/a11y, completo e reproduzível;
3. `STR-SEC-IAM-001` — inventário/guard de papéis, permissões, rotas públicas e realm;
4. `STR-ARCH-BE-003` — remover dois findings da busca global, reduzindo 6 → 4;
5. `STR-DOC-002` — contratos adversariais do storage local de documentos.

Os cinco owners partem de `main@357dd4b8827c0c9620d0dd7e8398bc3468418ff9`, não possuem dependência
same-wave, não criam migration e não utilizam provider ou dado real.

## Campanhas fora dos slots

### Backend/Testcontainers

Executar somente em ambiente com Java 21 e Docker:

```bash
cd backend
mvn -B -Dtest=ExecucaoFilaPostgresqlTest test
mvn -B -Dtest=ExecucaoFilaPostgresqlTest test
```

### Windows

1. atualizar `main`;
2. executar `START_CONTABILIDADE.bat dev`;
3. coletar evidência v2;
4. repetir o startup e comprovar reutilização;
5. reconciliar JSON/Markdown redigidos.

On-premise + Keycloak permanece bloqueado até Windows dev verde.

## Ondas

- Waves 002–008: `CONSUMED`;
- `CONTABILIDADE_FAST_LANE_WAVE_009`: `RELEASED_FOR_EXECUTION`;
- owners executáveis: `5`;
- migration owner: `NONE`.

## Próxima transição

Integrar e reconciliar os cinco resultados. Corrigir somente regressões comprovadas; evidência
ambiental pendente continua em campanha própria e não deve virar filler.

`CONTABILIDADE_CURRENT_STATE_FAST_LANE_WAVE_009_RELEASED`
