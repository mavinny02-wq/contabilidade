# Backlog estrutural do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_STRUCTURAL_REGISTRY`
**Atualizado em:** `2026-08-16`

Registro não significa seleção. Somente item em wave `RELEASED_FOR_EXECUTION` possui launcher.

## Status

`RELEASED_FOR_EXECUTION`, `READY_FOR_SELECTION`, `NEEDS_ANALYSIS`, `WAITING_FOR_RUNTIME`,
`WAITING_FOR_EXTERNAL_SETTING`, `WAITING_FOR_DECISION`, `DECOMPOSED`, `DONE` e `SUPERSEDED`.

## P0 — governança e estabilização

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-ORQ-000` | Fundação | `DONE` | checkpoint, locks, ledger, AGENTS e launchers |
| `STR-ORQ-001` | Git | `WAITING_FOR_EXTERNAL_SETTING` | ruleset após check remoto observado |
| `STR-ORQ-002` | Flyway | `DONE` | registry V1–V12 e lane única |
| `STR-ORQ-003` | Waves | `DONE` | lifecycle/dispatch v2 |
| `STR-OWN-001` | Ownership | `DONE` | CODEOWNERS |
| `FIX-STARTUP-MAIN-001` | Startup | `DONE` | runtime Windows pendente |
| `FIX-BUILDX-STARTUP-001` | Startup | `DONE_RUNTIME_WINDOWS_PENDING` | bootstrap Buildx resiliente; guard verde |
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
| `STR-WRK-001` | Worker | `DONE` | lease/retry/idempotência/shutdown e browser rerun |
| `STR-QA-001` | Coverage | `DONE_FRONTEND_FOCUSED_RERUN_PENDING` | backend/frontend medidos; worker completo |
| `STR-API-001` | API | `DONE` | OpenAPI/compatibility |
| `STR-DATA-001` | Dados | `DONE` | fixtures sintéticas governadas |
| `STR-PERF-001` | Performance | `DONE` | budgets e baseline |
| `STR-FE-BUNDLE-001` | Frontend | `DONE` | maior chunk 412.562 bytes |
| `STR-OBS-001` | Observabilidade | `DONE` | correlação/logs/métricas focadas |
| `STR-ARCH-001` | Arquitetura | `DONE` | grafo, ciclos e boundaries |
| `VAL-W006-FULLSTACK-007` | Integração | `DONE` | smoke pós-hardening verde |
| `STR-FE-001` | Acessibilidade | `DONE` | teclado/foco/a11y/browser verdes |
| `STR-API-002` | Contract tests | `DONE` | call sites ↔ usage map ↔ OpenAPI |
| `STR-QA-WRK-002` | Worker quality | `DONE` | coverage completo com Chromium |
| `STR-CTX-001` | Tokens | `DONE` | telemetria/custo por outcome |
| `VAL-W007-FULLSTACK-008` | Integração | `DONE` | smoke pós-Wave 007/startup verde |
| `STR-QA-BE-001` | Backend quality | `DONE_RUNTIME_DOCKER_PENDING` | suíte crítica criada e compilada |
| `VAL-QA-BE-DOCKER-001` | Backend runtime | `WAITING_FOR_RUNTIME` | duas execuções em Java 21 + Docker |
| `STR-OBS-002` | Operação | `DONE` | 7 SLOs, 15 alertas, guard e runbook |
| `STR-ARCH-002` | Arquitetura | `DONE` | worker isolado; 600 arestas e 6 findings |
| `STR-CTX-002` | Contexto | `DONE` | budgets por classe de task |

## Fast Lane Wave 009

| ID | Área | Status | Resultado esperado |
|---|---|---|---|
| `VAL-W008-FULLSTACK-009` | Integração | `RELEASED_FOR_EXECUTION` | smoke único depois da Wave 008 |
| `STR-QA-FE-002` | Frontend quality | `RELEASED_FOR_EXECUTION` | coverage pós-lazy/a11y completo e reproduzível |
| `STR-SEC-IAM-001` | IAM | `RELEASED_FOR_EXECUTION` | inventário papéis/permissões/rotas/realm e guard |
| `STR-ARCH-BE-003` | Arquitetura backend | `RELEASED_FOR_EXECUTION` | remover dois findings da busca global |
| `STR-DOC-002` | Documentos | `RELEASED_FOR_EXECUTION` | contratos do storage local e testes adversariais |

## Decomposição de documentos

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-DOC-001` | Documentos | `DECOMPOSED` | épico estrutural dividido em owners seguros |
| `STR-DOC-002` | Storage local | `RELEASED_FOR_EXECUTION` | containment, symlink, atomicidade e cleanup |
| `STR-DOC-003` | Antimalware | `NEEDS_ANALYSIS` | scanner, quarentena, timeout e override governado |
| `STR-DOC-004` | Storage remoto | `NEEDS_ANALYSIS` | contrato S3/MinIO sem mudar autoridade do domínio |
| `STR-DOC-005` | Retenção | `WAITING_FOR_DECISION` | aprovação, quarentena, descarte e restauração |

## P2 — operação e evolução

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-OPS-001` | Continuidade | `WAITING_FOR_RUNTIME` | restore rehearsal e RPO/RTO |
| `STR-REL-002` | Deploy | `WAITING_FOR_RUNTIME` | promoção/provenance/rollback |
| `STR-QA-002` | Quality gate | `WAITING_FOR_EXTERNAL_SETTING` | thresholds no required check após CI remota |

## Campanhas fora dos slots

- `VAL-QA-BE-DOCKER-001`: executor Docker;
- Windows dev + segundo startup: humano;
- on-premise + Keycloak: bloqueado até Windows dev verde;
- GitHub Actions/branch protection: configuração externa pendente;
- restore/deploy: campanha runtime;
- providers reais/pagos: não autorizados.

`BACKLOG_ESTRUTURAL_FAST_LANE_WAVE_009_RELEASED`
