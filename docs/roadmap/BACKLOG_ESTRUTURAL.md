# Backlog estrutural do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_STRUCTURAL_REGISTRY`  
**Atualizado em:** `2026-08-16`

Este arquivo é owner dos IDs estruturais. Registro não significa seleção ou execução.

## Status

- `IN_REVIEW_THIS_PR`: implementação presente na PR de governança ainda aberta;
- `READY_FOR_SELECTION`: contrato definido e owner disponível;
- `PREPARED_NOT_RELEASED`: selecionado em wave preparada, sem launcher executável;
- `PARTIAL_CORRECTION_REQUIRED`: parte integrada, aceite ainda incompleto;
- `WAITING_FOR_DECISION`: depende de decisão humana/ambiente;
- `BLOCKED_BY_OWNER`: owner aberto/reservado;
- `DONE`: resultado integrado e reconciliado.

## Itens P0

| ID | Área | Status | Resultado esperado |
|---|---|---|---|
| `STR-ORQ-000` | Orquestração | `IN_REVIEW_THIS_PR` | checkpoint, locks, ledger, launchers, guards e AGENTS hierárquicos |
| `FIX-STARTUP-MAIN-001` | Startup/infra | `PREPARED_NOT_RELEASED` | reaplicar/superseder PR `#56` na main atual preservando CI e guards já integrados |
| `BUG-RUN-001` | Runtime Windows | `PREPARED_NOT_RELEASED` | completar coletor com Compose, health, Flyway, endpoints e evidência de segundo startup |
| `STR-ORQ-001` | Git | `WAITING_FOR_DECISION` | branch protection e required checks após estabilizar nomes dos jobs |
| `STR-ORQ-002` | Flyway | `DONE` | registry V1–V12, checksum, duplicata, retrocesso e lane única |
| `STR-TEST-001` | Evidência | `DONE` | gate legado decomposto em owners, ambientes, reuse e reruns focados |
| `STR-ORQ-003` | Ondas | `PREPARED_NOT_RELEASED` | manifests prepared/released/consumed/superseded e validação determinística |
| `STR-OWN-001` | Ownership | `PREPARED_NOT_RELEASED` | CODEOWNERS/hotspots com identidade real e fallback de maintainer único |
| `STR-SEC-001` | Segurança | `NEEDS_ANALYSIS` | guard local/CI de segredo/PII, redaction e allowlist governada |
| `STR-RUN-001` | Runtime | `PARTIAL_CORRECTION_REQUIRED` | inventário/redaction integrado; runtime real ausente e sucedido por `BUG-RUN-001` |

## Itens P1

| ID | Área | Status | Resultado esperado |
|---|---|---|---|
| `STR-REL-001` | Release | `PREPARED_NOT_RELEASED` | fonte de versão única e guard entre VERSION, Maven, npm, imagens e docs |
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
| `STR-ARCH-001` | Arquitetura | `NEEDS_ANALYSIS` | ADRs, boundaries e detecção de dependência indevida |
| `STR-DOC-001` | Documentos | `NEEDS_ANALYSIS` | retenção/integridade/storage auditável |
| `STR-REL-002` | Deploy | `BLOCKED_BY_OWNER` | promoção de imagens, provenance e rollback após startup estabilizado |
| `STR-QA-001` | Qualidade | `NEEDS_ANALYSIS` | coverage agregado atual e ratchet baseado em medição |

## Evidência de estabilização consumida

- full-stack Linux controlado: verde;
- backend com PostgreSQL: verde;
- frontend em Node 24: verde;
- worker em Node 24 + Chromium: verde;
- guard Docker: verde;
- migration registry: verde.

Não gerar novos itens para repetir essas provas sem delta material.

## Ordem recomendada

1. integrar `STR-ORQ-000`;
2. executar a Wave 003: startup, coletor runtime, manifests, versão e owners;
3. executar campanha Windows dev;
4. corrigir somente falhas classificadas;
5. validar on-premise + Keycloak;
6. habilitar branch protection/required checks;
7. avançar para segurança, contratos, observabilidade e coverage.

`BACKLOG_ESTRUTURAL_WAVE_003_PREPARED`
