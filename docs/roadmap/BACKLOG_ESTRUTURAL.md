# Backlog estrutural do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_STRUCTURAL_REGISTRY`
**Atualizado em:** `2026-08-16`

Registro não significa seleção. Somente item em wave `RELEASED_FOR_EXECUTION` possui launcher.

## Status

`RELEASED_FOR_EXECUTION`, `READY_FOR_SELECTION`, `NEEDS_ANALYSIS`,
`WAITING_FOR_RUNTIME`, `WAITING_FOR_EXTERNAL_SETTING`, `DONE`, `SUPERSEDED`.

## P0 — governança e estabilização

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-ORQ-000` | Fundação | `DONE` | checkpoint, locks, ledger, AGENTS e launchers |
| `STR-ORQ-001` | Git | `WAITING_FOR_EXTERNAL_SETTING` | ruleset após check remoto observado |
| `STR-ORQ-002` | Flyway | `DONE` | registry V1–V12 e lane única |
| `STR-ORQ-003` | Waves | `DONE` | lifecycle/dispatch v2 |
| `STR-OWN-001` | Ownership | `DONE` | CODEOWNERS |
| `FIX-STARTUP-MAIN-001` | Startup | `DONE` | runtime Windows pendente |
| `BUG-RUN-001` | Evidência Windows | `DONE` | coletor v2; prova local pendente |
| `STR-CI-001` | Required CI | `DONE_WITH_EXTERNAL_PROOF_PENDING` | workflow/check estáveis, sem run recente observada |
| `STR-CI-002` | CI observável | `RELEASED_FOR_EXECUTION` | triggers, diagnóstico e integração dos gates concluídos |

## P1 — engenharia confiável

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-SEC-001` | Segredos/PII | `DONE` | scanner/redaction/exceções |
| `STR-SEC-002` | Supply chain | `RELEASED_FOR_EXECUTION` | SAST/IaC/container/provenance |
| `STR-DEP-001` | Dependências | `DONE_NETWORK_SCAN_PENDING` | SBOM/licenças/advisory policy |
| `STR-DB-001` | Banco de teste | `DONE_DOCKER_PROOF_PENDING` | PostgreSQL 17 Testcontainers |
| `STR-WRK-001` | Worker | `DONE_BROWSER_RERUN_PENDING` | lease/retry/idempotência/shutdown |
| `STR-QA-001` | Coverage | `DONE_WORKER_INCOMPLETE` | baseline/ratchet medidos |
| `STR-API-001` | API | `DONE` | OpenAPI/compatibility |
| `STR-DATA-001` | Dados | `DONE` | fixtures sintéticas governadas |
| `STR-PERF-001` | Performance | `DONE` | budgets e baseline |
| `STR-FE-BUNDLE-001` | Frontend | `RELEASED_FOR_EXECUTION` | chunk inicial abaixo de 500 KiB |
| `STR-OBS-001` | Observabilidade | `RELEASED_FOR_EXECUTION` | correlação/logs/métricas sem PII |
| `STR-ARCH-001` | Arquitetura | `RELEASED_FOR_EXECUTION` | grafo, ciclos e boundaries |
| `STR-FE-001` | Acessibilidade | `READY_FOR_SELECTION` | browser/a11y após bundle |
| `STR-CTX-001` | Tokens | `NEEDS_ANALYSIS` | telemetria real/custo por outcome |

## P2 — operação e evolução

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-DOC-001` | Documentos | `NEEDS_ANALYSIS` | retenção/integridade/storage |
| `STR-OPS-001` | Continuidade | `WAITING_FOR_RUNTIME` | restore rehearsal e RPO/RTO |
| `STR-REL-002` | Deploy | `WAITING_FOR_RUNTIME` | promoção/provenance/rollback |
| `STR-QA-002` | Quality gate | `READY_FOR_SELECTION` | thresholds/ratchet no required check após CI remota |
| `STR-API-002` | Contract tests | `READY_FOR_SELECTION` | consumer tests após OpenAPI baseline |

## Campanha humana fora dos slots

Windows dev e segundo startup usam o coletor v2. On-premise + Keycloak depende desse resultado.

## Ordem recomendada

1. consumir Wave 006;
2. observar run real do required check;
3. habilitar branch protection/ruleset;
4. integrar thresholds e checks maduros sem mudar o nome do gate;
5. executar acessibilidade e restore;
6. validar Windows/on-premise quando disponível.

`BACKLOG_ESTRUTURAL_WAVE_006_RELEASED`
