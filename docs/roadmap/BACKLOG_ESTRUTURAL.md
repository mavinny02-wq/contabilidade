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
| `STR-CI-001` | Required CI | `DONE_WITH_EXTERNAL_PROOF_PENDING` | workflow/check estáveis |
| `STR-CI-002` | CI observável | `DONE_REMOTE_EVIDENCE_BLOCKED` | triggers e gates integrados |

## P1 — engenharia confiável

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-SEC-001` | Segredos/PII | `DONE` | scanner/redaction/exceções |
| `STR-SEC-002` | Supply chain | `DONE_CI_SCAN_PENDING` | SAST/IaC/container/provenance estrutural |
| `STR-DEP-001` | Dependências | `DONE_NETWORK_SCAN_PENDING` | SBOM/licenças/advisory policy |
| `STR-DB-001` | Banco de teste | `DONE_DOCKER_PROOF_PENDING` | PostgreSQL 17 Testcontainers |
| `STR-WRK-001` | Worker | `DONE_BROWSER_RERUN_PENDING` | lease/retry/idempotência/shutdown |
| `STR-QA-001` | Coverage | `DONE_WORKER_INCOMPLETE` | baseline/ratchet medidos |
| `STR-API-001` | API | `DONE` | OpenAPI/compatibility |
| `STR-DATA-001` | Dados | `DONE` | fixtures sintéticas governadas |
| `STR-PERF-001` | Performance | `DONE` | budgets e baseline |
| `STR-FE-BUNDLE-001` | Frontend | `DONE` | maior chunk 412.562 bytes |
| `STR-OBS-001` | Observabilidade | `DONE_FOCUSED_RUNTIME_PENDING` | correlação/logs/métricas |
| `STR-ARCH-001` | Arquitetura | `DONE` | grafo, ciclos e boundaries |
| `VAL-W006-FULLSTACK-007` | Integração | `RELEASED_FOR_EXECUTION` | smoke pós-hardening |
| `STR-FE-001` | Acessibilidade | `RELEASED_FOR_EXECUTION` | teclado/foco/a11y/browser |
| `STR-API-002` | Contract tests | `RELEASED_FOR_EXECUTION` | call sites ↔ usage map ↔ OpenAPI |
| `STR-QA-WRK-002` | Worker quality | `RELEASED_FOR_EXECUTION` | coverage completo com Chromium |
| `STR-CTX-001` | Tokens | `RELEASED_FOR_EXECUTION` | telemetria real/custo por outcome |

## P2 — operação e evolução

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-DOC-001` | Documentos | `NEEDS_ANALYSIS` | retenção/integridade/storage |
| `STR-OPS-001` | Continuidade | `WAITING_FOR_RUNTIME` | restore rehearsal e RPO/RTO |
| `STR-REL-002` | Deploy | `WAITING_FOR_RUNTIME` | promoção/provenance/rollback |
| `STR-QA-002` | Quality gate | `WAITING_FOR_EXTERNAL_SETTING` | thresholds no required check após CI remota |
| `STR-QA-BE-001` | Backend quality | `READY_FOR_SELECTION` | testes críticos de fila/lease/idempotência |
| `STR-OBS-002` | Operação | `READY_FOR_SELECTION` | SLO, alertas e runbook após métricas |
| `STR-ARCH-002` | Arquitetura | `READY_FOR_SELECTION` | reduzir findings allowlisted |
| `STR-CTX-002` | Contexto | `NEEDS_ANALYSIS` | budgets automáticos por classe de task |

## Fast Lane Wave 007

1. `VAL-W006-FULLSTACK-007`;
2. `STR-FE-001`;
3. `STR-API-002`;
4. `STR-QA-WRK-002`;
5. `STR-CTX-001`.

## Campanhas fora dos slots

- Windows dev + segundo startup: humano;
- on-premise + Keycloak: bloqueado até Windows dev verde;
- GitHub Actions/branch protection: configuração externa pendente.

## Ordem recomendada após a Fast Lane

1. reconciliar o smoke e corrigir somente regressões comprovadas;
2. promover coverage completo do worker;
3. selecionar testes críticos de backend e SLO/alertas;
4. reduzir findings arquiteturais;
5. validar Windows e on-premise quando disponível.

`BACKLOG_ESTRUTURAL_FAST_LANE_WAVE_007_RELEASED`
