# Backlog estrutural do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_STRUCTURAL_REGISTRY`
**Atualizado em:** `2026-08-17`

Registro não significa seleção. Somente item em wave `RELEASED_FOR_EXECUTION` possui launcher.

## Status

`RELEASED_FOR_EXECUTION`, `READY_FOR_SELECTION`, `NEEDS_ANALYSIS`, `WAITING_FOR_RUNTIME`,
`WAITING_FOR_EXTERNAL_SETTING`, `WAITING_FOR_DECISION`, `DECOMPOSED`, `DONE` e `SUPERSEDED`.

## P0 — governança e estabilização

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-ORQ-000/003` | Fundação/waves | `DONE` | checkpoint, locks, lifecycle e dispatch v2 |
| `STR-ORQ-001` | Git | `WAITING_FOR_EXTERNAL_SETTING` | ruleset após check remoto observado |
| `STR-ORQ-002` | Flyway | `DONE` | registry V1–V12 e lane única |
| `STR-OWN-001` | Ownership | `DONE` | CODEOWNERS |
| `STR-CI-001/002` | Required CI | `DONE_REMOTE_EVIDENCE_BLOCKED` | workflow estático; nenhuma run observada |
| `STR-CI-003` | CI local | `RELEASED_FOR_EXECUTION` | paridade local, resume e ledger sem alegar check remoto |
| `BUG-RUN-001` | Evidência Windows | `DONE_RUNTIME_PENDING` | coletor v2 |
| `FIX-BUILDX-STARTUP-001` | Startup | `SUPERSEDED` | builder isolado removido |
| `FIX-BUILDKIT-DNS-001` | Startup | `SUPERSEDED` | DNS project-scoped removido |
| `FIX-BUILDKIT-DNS-002` | Startup | `DONE_RUNTIME_PENDING` | DNS/proxy sob Docker Desktop/daemon |
| `FIX-DOCKER-CONTEXT-001` | Startup | `DONE_RUNTIME_PENDING` | contexto ativo preservado |
| `FIX-POWERSHELL-COLON-001` | Startup | `DONE_RUNTIME_PENDING` | parser corrigido e guard |
| `FIX-STARTUP-PREFLIGHT-001` | Startup | `DONE_WINDOWS_PROOF_PENDING` | parse-all antes do build |
| `FIX-TECH-AUTH-001` | Segurança HTTP | `DONE` | negação de method security retorna 403 |

## P1 — engenharia confiável

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-SEC-001/002` | Segurança | `DONE_CI_SCAN_PENDING` | segredo/PII e supply-chain |
| `STR-SEC-003` | Secret lifecycle | `DONE` | inventário, owner, fonte, rotação e revogação |
| `STR-DEP-001` | Dependências | `DONE_NETWORK_SCAN_PENDING` | SBOM/licenças/advisory |
| `STR-DB-001` | Banco de teste | `DONE_DOCKER_PROOF_PENDING` | PostgreSQL 17/Testcontainers |
| `VAL-QA-BE-DOCKER-001` | Backend runtime | `WAITING_FOR_RUNTIME` | duas execuções em Java 21 + Docker |
| `STR-WRK-001` | Worker | `DONE` | lease/retry/idempotência/shutdown |
| `STR-QA-001` | Coverage | `DONE` | baselines e ratchet |
| `STR-QA-FE-002` | Frontend quality | `DONE` | coverage atual e a11y |
| `STR-API-001/002` | API | `DONE` | OpenAPI e consumer contracts |
| `STR-DATA-001` | Dados | `DONE` | fixtures sintéticas |
| `STR-PERF-001` | Performance | `DONE` | budgets |
| `STR-FE-BUNDLE-001` | Frontend | `DONE` | chunk abaixo de 500 KiB |
| `STR-FE-001` | Acessibilidade | `DONE` | teclado/foco/browser |
| `STR-OBS-001/002` | Observabilidade | `DONE` | correlação, métricas, SLOs e alertas |
| `STR-OBS-003` | Synthetic monitoring | `RELEASED_FOR_EXECUTION` | probes local-only, bounded e redigidos |
| `STR-CTX-001/002` | Contexto | `DONE` | telemetria e budgets |
| `STR-INF-001` | Ambientes | `DONE` | guard dev/on-premise/CI |
| `STR-INF-002` | TLS/certificados | `RELEASED_FOR_EXECUTION` | lifecycle, expiração, SAN e source guard |
| `STR-INF-003` | IaC on-premise | `RELEASED_FOR_EXECUTION` | inventory/plan e drift guard |
| `STR-SEC-IAM-001` | IAM guard | `DONE` | policy fail-closed comprovada |
| `VAL-TECH-CONSOLE-CURRENT-001` | Console Técnica | `DONE` | regressão 500/403 corrigida |
| `VAL-W011-FULLSTACK-012` | Integração | `RELEASED_FOR_EXECUTION` | smoke único do HEAD pós-Wave 011 |

## Arquitetura

| ID | Status | Resultado |
|---|---|---|
| `STR-ARCH-001/002/003` | `DONE` | findings 10 → 4 |
| `STR-ARCH-BE-004` | `DONE` | Certidão/Empresa; findings 4 → 1 |
| `STR-ARCH-BE-005` | `DONE` | Documento/Empresa; findings 1 → 0 |

## Documentos

| ID | Status | Resultado |
|---|---|---|
| `STR-DOC-001` | `DECOMPOSED` | épico dividido |
| `STR-DOC-002` | `DONE` | storage local endurecido |
| `STR-DOC-003` | `NEEDS_ANALYSIS` | antimalware, quarentena e override |
| `STR-DOC-004` | `NEEDS_ANALYSIS` | storage remoto |
| `STR-DOC-005` | `WAITING_FOR_DECISION` | retenção e descarte |

## Produção, release e continuidade

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-REL-003` | Release tooling | `DONE` | bundle imutável e rollback/Flyway guard |
| `STR-REL-002` | Deploy runtime | `WAITING_FOR_RUNTIME` | promoção/provenance/rollback reais |
| `STR-OPS-002` | Recovery tooling | `DONE` | planner offline e guard não destrutivo |
| `STR-OPS-001` | Recovery runtime | `WAITING_FOR_RUNTIME` | restore rehearsal e RPO/RTO reais |
| `STR-QA-002` | Quality gate | `WAITING_FOR_EXTERNAL_SETTING` | thresholds após CI remota |

## Fast Lane Wave 012

| Slot | ID | Resultado esperado |
|---:|---|---|
| 1 | `VAL-W011-FULLSTACK-012` | HEAD atual verde após auth/document boundary |
| 2 | `STR-INF-002` | TLS/cert lifecycle determinístico e seguro |
| 3 | `STR-INF-003` | plano IaC on-premise sem mutação de host |
| 4 | `STR-CI-003` | runner local com paridade e classificação ambiental |
| 5 | `STR-OBS-003` | synthetic monitoring local-only e redigido |

## Campanhas fora dos slots

- Windows dev + segundo startup: humano;
- on-premise + Keycloak: após Windows dev verde;
- PostgreSQL/Testcontainers: executor Docker;
- GitHub Actions/branch protection: configuração externa;
- restore real e promoção real: runtime;
- providers reais/pagos: não autorizados.

`BACKLOG_ESTRUTURAL_FAST_LANE_WAVE_012_RELEASED`
