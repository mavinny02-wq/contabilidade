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
| `STR-ORQ-000` | Fundação | `DONE` | checkpoint, locks, ledger, AGENTS e launchers |
| `STR-ORQ-001` | Git | `WAITING_FOR_EXTERNAL_SETTING` | ruleset após check remoto observado |
| `STR-ORQ-002` | Flyway | `DONE` | registry V1–V12 e lane única |
| `STR-ORQ-003` | Waves | `DONE` | lifecycle/dispatch v2 |
| `STR-OWN-001` | Ownership | `DONE` | CODEOWNERS |
| `STR-CI-001/002` | Required CI | `DONE_REMOTE_EVIDENCE_BLOCKED` | workflow estático; nenhuma run observada |
| `BUG-RUN-001` | Evidência Windows | `DONE_RUNTIME_PENDING` | coletor v2 |
| `FIX-BUILDX-STARTUP-001` | Startup | `SUPERSEDED` | builder isolado substituído pelo contrato PRIMA |
| `FIX-BUILDKIT-DNS-001` | Startup | `SUPERSEDED` | DNS project-scoped removido |
| `FIX-BUILDKIT-DNS-002` | Startup | `DONE_RUNTIME_PENDING` | DNS/proxy sob Docker Desktop/daemon |
| `FIX-DOCKER-CONTEXT-001` | Startup | `DONE_RUNTIME_PENDING` | contexto ativo preservado |
| `FIX-POWERSHELL-COLON-001` | Startup | `DONE_RUNTIME_PENDING` | interpolação corrigida e guard criada |
| `FIX-STARTUP-PREFLIGHT-001` | Startup | `RELEASED_FOR_EXECUTION` | parse-all antes do build |

## P1 — engenharia confiável

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-SEC-001/002` | Segurança | `DONE_CI_SCAN_PENDING` | segredo/PII e supply-chain |
| `STR-DEP-001` | Dependências | `DONE_NETWORK_SCAN_PENDING` | SBOM/licenças/advisory |
| `STR-DB-001` | Banco de teste | `DONE_DOCKER_PROOF_PENDING` | PostgreSQL 17/Testcontainers |
| `VAL-QA-BE-DOCKER-001` | Backend runtime | `WAITING_FOR_RUNTIME` | duas execuções em Java 21 + Docker |
| `STR-WRK-001` | Worker | `DONE` | lease/retry/idempotência/shutdown |
| `STR-QA-001` | Coverage | `DONE` | baselines por componente e ratchet |
| `STR-QA-FE-002` | Frontend quality | `DONE` | coverage atual e a11y completos |
| `STR-API-001/002` | API | `DONE` | OpenAPI e consumer contracts |
| `STR-DATA-001` | Dados | `DONE` | fixtures sintéticas |
| `STR-PERF-001` | Performance | `DONE` | budgets e baseline |
| `STR-FE-BUNDLE-001` | Frontend | `DONE` | maior chunk abaixo de 500 KiB |
| `STR-FE-001` | Acessibilidade | `DONE` | teclado/foco/a11y/browser |
| `STR-OBS-001/002` | Observabilidade | `DONE` | correlação, métricas, SLOs e alertas |
| `STR-ARCH-001/002/003` | Arquitetura | `DONE` | grafo 600 arestas; findings 10 → 4 |
| `STR-CTX-001/002` | Contexto | `DONE` | telemetria e budgets |
| `STR-DOC-002` | Documentos | `DONE` | storage local endurecido |
| `STR-SEC-IAM-001` | IAM guard | `DONE_WITH_PRODUCT_REGRESSION` | unknown role aceito |
| `FIX-SEC-IAM-001` | IAM produto | `RELEASED_FOR_EXECUTION` | converter fail-closed |
| `VAL-TECH-CONSOLE-CURRENT-001` | Console Técnica | `RELEASED_FOR_EXECUTION` | prova dos endpoints atuais |
| `STR-ARCH-BE-004` | Arquitetura | `RELEASED_FOR_EXECUTION` | Certidão/Empresa; findings 4 → 1 |
| `STR-INF-001` | Ambientes | `RELEASED_FOR_EXECUTION` | guard dev/on-premise/CI |

## Fast Lane Wave 010

| Slot | ID | Resultado esperado |
|---:|---|---|
| 1 | `FIX-SEC-IAM-001` | papel desconhecido não produz authority |
| 2 | `FIX-STARTUP-PREFLIGHT-001` | ParserError detectado antes de Maven/npm/build |
| 3 | `VAL-TECH-CONSOLE-CURRENT-001` | contrato atual backend/frontend comprovado |
| 4 | `STR-ARCH-BE-004` | findings arquiteturais 4 → 1 |
| 5 | `STR-INF-001` | drift de ambiente detectável e determinístico |

## Decomposição de documentos

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-DOC-001` | Documentos | `DECOMPOSED` | épico dividido |
| `STR-DOC-002` | Storage local | `DONE` | containment, symlink, atomicidade e cleanup |
| `STR-DOC-003` | Antimalware | `NEEDS_ANALYSIS` | scanner, quarentena, timeout e override |
| `STR-DOC-004` | Storage remoto | `NEEDS_ANALYSIS` | contrato S3 sem mudar domínio |
| `STR-DOC-005` | Retenção | `WAITING_FOR_DECISION` | aprovação, descarte e restauração |

## P2 — operação e evolução

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-ARCH-BE-005` | Arquitetura | `READY_FOR_SELECTION` | remover finding Documento → Empresa |
| `STR-OPS-001` | Continuidade | `WAITING_FOR_RUNTIME` | restore rehearsal e RPO/RTO |
| `STR-REL-002` | Deploy | `WAITING_FOR_RUNTIME` | promoção/provenance/rollback |
| `STR-QA-002` | Quality gate | `WAITING_FOR_EXTERNAL_SETTING` | thresholds após CI remota |

## Campanhas fora dos slots

- Windows dev + segundo startup: humano;
- on-premise + Keycloak: bloqueado até Windows dev verde;
- GitHub Actions/branch protection: configuração externa;
- restore/deploy: campanha runtime;
- providers reais/pagos: não autorizados.

`BACKLOG_ESTRUTURAL_FAST_LANE_WAVE_010_RELEASED`
