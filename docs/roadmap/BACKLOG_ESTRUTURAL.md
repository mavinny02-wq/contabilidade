# Backlog estrutural do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_STRUCTURAL_REGISTRY`  
**Atualizado em:** `2026-08-16`

Registro não significa seleção. Somente itens em wave `RELEASED_FOR_EXECUTION` estão executáveis.

## Status

- `RELEASED_FOR_EXECUTION`: launcher exato publicado;
- `READY_FOR_SELECTION`: contrato definido e owner disponível;
- `PARTIAL_CORRECTION_REQUIRED`: parte integrada, aceite ainda incompleto;
- `WAITING_FOR_DECISION`: depende de decisão humana/ambiente;
- `BLOCKED_BY_OWNER`: owner aberto/reservado;
- `DONE`: resultado integrado e reconciliado.

## Itens P0

| ID | Área | Status | Resultado esperado |
|---|---|---|---|
| `STR-ORQ-000` | Orquestração | `DONE` | checkpoint, locks, ledger, launchers, guards e AGENTS hierárquicos |
| `FIX-STARTUP-MAIN-001` | Startup/infra | `RELEASED_FOR_EXECUTION` | reaplicar a direção da PR superseded sobre a latest main preservando CI/guards |
| `BUG-RUN-001` | Runtime Windows | `RELEASED_FOR_EXECUTION` | completar coletor com Compose, health, Flyway, endpoints e segundo startup |
| `STR-ORQ-001` | Git | `WAITING_FOR_DECISION` | branch protection e required checks após estabilizar nomes dos jobs |
| `STR-ORQ-002` | Flyway | `DONE` | registry V1–V12, checksum, duplicata, retrocesso e lane única |
| `STR-TEST-001` | Evidência | `DONE` | gate legado decomposto em owners, ambientes, reuse e reruns focados |
| `STR-ORQ-003` | Ondas | `RELEASED_FOR_EXECUTION` | manifests prepared/released/consumed/superseded e validação determinística |
| `STR-OWN-001` | Ownership | `RELEASED_FOR_EXECUTION` | CODEOWNERS/hotspots com identidade real e fallback de maintainer único |
| `STR-SEC-001` | Segurança | `NEEDS_ANALYSIS` | guard local/CI de segredo/PII, redaction e allowlist governada |
| `STR-RUN-001` | Runtime | `PARTIAL_CORRECTION_REQUIRED` | inventário/redaction integrado; sucedido por `BUG-RUN-001` |

## Itens P1

| ID | Área | Status | Resultado esperado |
|---|---|---|---|
| `STR-REL-001` | Release | `RELEASED_FOR_EXECUTION` | fonte de versão única e guard entre VERSION, Maven, npm, imagens e docs |
| `STR-CTX-001` | Tokens | `NEEDS_ANALYSIS` | telemetria real do provedor e custo por outcome |
| `STR-DEP-001` | Dependências | `NEEDS_ANALYSIS` | licença, SBOM, vulnerabilidade e política de exceção |
| `STR-API-001` | Contratos | `NEEDS_ANALYSIS` | OpenAPI e compatibility guard backend/frontend |
| `STR-DB-001` | Banco | `NEEDS_ANALYSIS` | Testcontainers/PostgreSQL lane reproduzível |
| `STR-DATA-001` | Dados | `NEEDS_ANALYSIS` | fixtures sintéticas e guard contra credencial/dado real |
| `STR-OBS-001` | Observabilidade | `NEEDS_ANALYSIS` | correlação, métricas, SLO e runbook sem PII |
| `STR-WRK-001` | Worker | `NEEDS_ANALYSIS` | regressões de lease/retry/idempotência/shutdown |
| `STR-FE-001` | Frontend | `NEEDS_ANALYSIS` | acessibilidade, browser e contrato visual |
| `STR-SEC-002` | Supply chain | `NEEDS_ANALYSIS` | secret/SAST/container scanning |
| `STR-OPS-001` | Continuidade | `WAITING_FOR_DECISION` | rehearsal de restore e RPO/RTO |

## Itens P2

| ID | Área | Status | Resultado esperado |
|---|---|---|---|
| `STR-PERF-001` | Performance | `NEEDS_ANALYSIS` | budgets backend/frontend/worker |
| `STR-ARCH-001` | Arquitetura | `NEEDS_ANALYSIS` | ADRs, boundaries e dependência indevida |
| `STR-DOC-001` | Documentos | `NEEDS_ANALYSIS` | retenção/integridade/storage auditável |
| `STR-REL-002` | Deploy | `BLOCKED_BY_OWNER` | promoção de imagens, provenance e rollback após startup estabilizado |
| `STR-QA-001` | Qualidade | `NEEDS_ANALYSIS` | coverage agregado e ratchet baseado em medição |

## Evidência consumida

Full-stack, backend com PostgreSQL, frontend Node 24, worker Node 24 + Chromium, guard Docker e
migration registry estão verdes. Não gerar tarefas para repeti-los sem delta material.

## Ordem recomendada

1. executar e integrar a Wave 003;
2. executar a campanha Windows dev;
3. corrigir somente falhas classificadas;
4. validar on-premise + Keycloak;
5. habilitar branch protection/required checks;
6. avançar para segurança, contratos, observabilidade e coverage.

`BACKLOG_ESTRUTURAL_WAVE_003_RELEASED`
