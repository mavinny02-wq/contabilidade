# Backlog estrutural do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_STRUCTURAL_REGISTRY`
**Atualizado em:** `2026-08-16`

Registro não significa seleção. Somente item presente em wave `RELEASED_FOR_EXECUTION` possui
launcher executável.

## Status

- `RELEASED_FOR_EXECUTION`;
- `READY_FOR_SELECTION`;
- `NEEDS_ANALYSIS`;
- `WAITING_FOR_RUNTIME`;
- `WAITING_FOR_DECISION`;
- `DONE`;
- `SUPERSEDED`.

## P0 — governança e estabilização

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-ORQ-000` | Fundação | `DONE` | checkpoint, locks, ledger, AGENTS, guards e launchers |
| `STR-ORQ-001` | Git | `WAITING_FOR_DECISION` | ruleset/branch protection após required gate estável |
| `STR-ORQ-002` | Flyway | `DONE` | registry V1–V12 e lane única |
| `STR-TEST-001` | Evidência | `DONE` | gate legado decomposto |
| `STR-ORQ-003` | Waves | `DONE` | manifests/lifecycle determinísticos |
| `STR-OWN-001` | Ownership | `DONE` | CODEOWNERS com maintainer confirmado |
| `STR-RUN-001` | Windows | `DONE` | sucedido e completado por `BUG-RUN-001` |
| `FIX-STARTUP-MAIN-001` | Startup | `DONE` | startup oficial reaplicado; runtime Windows pendente |
| `BUG-RUN-001` | Evidência Windows | `DONE` | coletor v2 implementado; prova local pendente |
| `BUG-ORQ-001` | Dispatch | `RELEASED_FOR_EXECUTION` | chave idempotente e bloqueio de duplicata |
| `STR-SEC-001` | Segredos/PII | `RELEASED_FOR_EXECUTION` | scanner local, redaction e exceções expiráveis |

## P1 — engenharia confiável

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-REL-001` | Release | `DONE` | VERSION canônica, guard e metadados |
| `STR-CI-001` | Required gate | `READY_FOR_SELECTION` | gate estável após DB/worker/security/dependency lanes |
| `STR-DEP-001` | Dependências | `RELEASED_FOR_EXECUTION` | SBOM, licenças, advisory e exceções |
| `STR-DB-001` | Banco | `RELEASED_FOR_EXECUTION` | PostgreSQL 17 Testcontainers reproduzível |
| `STR-WRK-001` | Worker | `RELEASED_FOR_EXECUTION` | lease/retry/idempotência/shutdown |
| `STR-CTX-001` | Tokens | `NEEDS_ANALYSIS` | telemetria real e custo por outcome |
| `STR-API-001` | Contratos | `NEEDS_ANALYSIS` | OpenAPI e compatibility guard |
| `STR-DATA-001` | Dados | `NEEDS_ANALYSIS` | fixtures sintéticas e guard contra dado real |
| `STR-OBS-001` | Observabilidade | `NEEDS_ANALYSIS` | correlação, métricas, SLO e runbook |
| `STR-FE-001` | Frontend | `NEEDS_ANALYSIS` | acessibilidade/browser/contrato visual |
| `STR-SEC-002` | Supply chain | `NEEDS_ANALYSIS` | SAST/container/provenance |
| `STR-OPS-001` | Continuidade | `WAITING_FOR_DECISION` | restore rehearsal e RPO/RTO |

## P2 — qualidade e evolução

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-PERF-001` | Performance | `NEEDS_ANALYSIS` | budgets reproduzíveis |
| `STR-ARCH-001` | Arquitetura | `NEEDS_ANALYSIS` | boundaries, ADRs e dependência indevida |
| `STR-DOC-001` | Documentos | `NEEDS_ANALYSIS` | retenção/integridade/storage |
| `STR-REL-002` | Deploy | `WAITING_FOR_RUNTIME` | promoção/provenance/rollback após Windows dev |
| `STR-QA-001` | Coverage | `NEEDS_ANALYSIS` | baseline e ratchet medidos |

## Campanha humana fora dos slots

Windows dev e segundo startup devem ser executados com o coletor v2. On-premise + Keycloak depende
desse resultado.

## Ordem recomendada

1. consumir Wave 004;
2. criar `STR-CI-001` e estabilizar nomes de required checks;
3. habilitar `STR-ORQ-001`;
4. medir coverage e contratos;
5. validar Windows/on-premise conforme disponibilidade humana;
6. avançar observabilidade, supply chain, performance e continuidade.

`BACKLOG_ESTRUTURAL_WAVE_004_RELEASED`
