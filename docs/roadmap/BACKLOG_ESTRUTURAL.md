# Backlog estrutural do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_STRUCTURAL_REGISTRY`  
**Atualizado em:** `2026-08-16`

Registro não significa seleção. Somente item presente em wave `RELEASED_FOR_EXECUTION` possui
launcher executável.

## Status

- `RELEASED_FOR_EXECUTION`;
- `READY_FOR_SELECTION`;
- `NEEDS_ANALYSIS`;
- `IMPLEMENTED_AWAITING_CI`;
- `WAITING_FOR_RUNTIME`;
- `WAITING_FOR_DECISION`;
- `BLOCKED_BY_OWNER`;
- `DONE`;
- `SUPERSEDED`.

## P0 — governança e estabilização

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-ORQ-000` | Fundação | `DONE` | checkpoint, locks, ledger, AGENTS, guards e launchers |
| `STR-ORQ-001` | Git | `BLOCKED_BY_OWNER` | ruleset após `STR-CI-001` produzir check estável observado |
| `STR-ORQ-002` | Flyway | `DONE` | registry V1–V12 e lane única |
| `STR-TEST-001` | Evidência | `DONE` | gate legado decomposto |
| `STR-ORQ-003` | Waves | `DONE` | manifests/lifecycle determinísticos |
| `STR-OWN-001` | Ownership | `DONE` | CODEOWNERS com maintainer confirmado |
| `STR-RUN-001` | Windows | `DONE` | sucedido por `BUG-RUN-001` |
| `FIX-STARTUP-MAIN-001` | Startup | `DONE` | startup oficial reaplicado; runtime Windows pendente |
| `BUG-RUN-001` | Evidência Windows | `DONE` | coletor v2 implementado; prova local pendente |
| `BUG-ORQ-001` | Dispatch | `DONE` | chave idempotente, preflight e contrato v2 |
| `STR-SEC-001` | Segredos/PII | `DONE` | baseline sem achados e scanner local/CI |

## P1 — engenharia confiável

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-REL-001` | Release | `DONE` | VERSION canônica, guard e metadados |
| `STR-CI-001` | Required gate | `RELEASED_FOR_EXECUTION` | check único estável, Docker/Chromium e fan-in determinístico |
| `STR-DEP-001` | Dependências | `DONE` | SBOM/licenças verdes; advisory de rede permanece prova CI |
| `STR-DB-001` | Banco | `IMPLEMENTED_AWAITING_CI` | Testcontainers/PostgreSQL 17 implementado; Docker proof pendente |
| `STR-WRK-001` | Worker | `IMPLEMENTED_AWAITING_CI` | regressões focadas verdes; suíte completa requer Chromium |
| `STR-QA-001` | Coverage | `RELEASED_FOR_EXECUTION` | baseline real e ratchet sem threshold inventado |
| `STR-API-001` | Contratos | `RELEASED_FOR_EXECUTION` | OpenAPI canônico e compatibility guard |
| `STR-DATA-001` | Dados | `RELEASED_FOR_EXECUTION` | fixtures sintéticas, catálogo e guard contra dado real |
| `STR-OBS-001` | Observabilidade | `NEEDS_ANALYSIS` | correlação, métricas, SLO e runbook |
| `STR-FE-001` | Frontend | `NEEDS_ANALYSIS` | acessibilidade/browser/contrato visual |
| `STR-SEC-002` | Supply chain | `READY_FOR_SELECTION` | SAST, container scan e provenance após required gate |
| `STR-OPS-001` | Continuidade | `WAITING_FOR_DECISION` | restore rehearsal e RPO/RTO |
| `STR-CTX-001` | Tokens | `NEEDS_ANALYSIS` | telemetria real e custo por outcome |

## P2 — qualidade e evolução

| ID | Área | Status | Resultado |
|---|---|---|---|
| `STR-PERF-001` | Performance | `RELEASED_FOR_EXECUTION` | budgets de artefatos e crescimento não regressivo |
| `STR-ARCH-001` | Arquitetura | `NEEDS_ANALYSIS` | boundaries, ADRs e dependência indevida |
| `STR-DOC-001` | Documentos | `NEEDS_ANALYSIS` | retenção/integridade/storage |
| `STR-REL-002` | Deploy | `WAITING_FOR_RUNTIME` | promoção/provenance/rollback após Windows dev |
| `STR-FE-BUNDLE-001` | Frontend | `READY_FOR_SELECTION` | reduzir chunk principal após baseline de performance |
| `STR-OBS-002` | Operação | `NEEDS_ANALYSIS` | dashboards e alertas após métricas/SLO |

## Wave 005

Principais:

1. `STR-CI-001`;
2. `STR-QA-001`;
3. `STR-API-001`.

Extras, já contados dentro da capacidade máxima:

4. `STR-DATA-001`;
5. `STR-PERF-001`.

## Campanhas fora dos slots

- Windows dev + segundo startup: humano, pronto para execução;
- on-premise + Keycloak: bloqueado até Windows dev verde;
- branch protection/ruleset: ação GitHub externa após o check `Required CI / required-ci` ser
  observado em execução real.

## Ordem recomendada após a Wave 005

1. reconciliar o required gate e seus resultados Docker/Chromium;
2. habilitar `STR-ORQ-001` no GitHub;
3. incorporar coverage/API/data/performance ao gate sem renomear o check final;
4. executar `STR-SEC-002` e `STR-FE-001`;
5. avançar observabilidade, arquitetura, continuidade e deploy provenance.

`BACKLOG_ESTRUTURAL_WAVE_005_RELEASED`
