# Backlog estrutural do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_STRUCTURAL_REGISTRY`
**Atualizado em:** `2026-08-16`

Este arquivo é owner dos IDs estruturais. Registro não significa seleção ou execução.

## Status

- `IN_REVIEW_THIS_PR`: fundação presente nesta mudança;
- `READY_FOR_SELECTION`: contrato suficientemente definido;
- `NEEDS_ANALYSIS`: precisa shard/decisão antes de executar;
- `WAITING_FOR_DECISION`: depende de decisão humana/ambiente;
- `BLOCKED_BY_OWNER`: owner aberto/reservado;
- `DONE`: evidência integrada e reconciliada.

## Itens

| ID | P | Área | Status | Resultado esperado |
|---|---:|---|---|---|
| `STR-ORQ-000` | P0 | Orquestração | `IN_REVIEW_THIS_PR` | checkpoint, locks, ledger, launchers compactos, guards e AGENTS hierárquicos |
| `STR-ORQ-001` | P0 | Git | `READY_FOR_SELECTION` | proteção da `main`, required checks e proibição operacional de push direto |
| `STR-ORQ-002` | P0 | Flyway | `READY_FOR_SELECTION` | registry monotônico, detecção de duplicata/retrocesso e lane única |
| `STR-TEST-001` | P0 | Evidência | `READY_FOR_SELECTION` | decompor `GATE-VAL-001` por owner, ambiente, reuse e invalidação |
| `STR-ORQ-003` | P0 | Ondas | `READY_FOR_SELECTION` | manifests prepared/released/consumed validados deterministicamente |
| `STR-OWN-001` | P0 | Ownership | `READY_FOR_SELECTION` | CODEOWNERS/hotspots alinhados à matriz, sem inventar reviewer inexistente |
| `STR-SEC-001` | P0 | Segurança | `NEEDS_ANALYSIS` | guard de segredos/PII/logs com baseline e falso-positivo governado |
| `STR-RUN-001` | P0 | Runtime | `READY_FOR_SELECTION` | coletor Windows machine-readable sem segredo/provider |
| `STR-REL-001` | P1 | Release | `READY_FOR_SELECTION` | consistência de VERSION, pom, package, manifests e changelog |
| `STR-CTX-001` | P1 | Tokens | `NEEDS_ANALYSIS` | telemetria real do provedor integrada ao profiler e métricas por outcome |
| `STR-DEP-001` | P1 | Dependências | `NEEDS_ANALYSIS` | licença/SBOM/vulnerabilidade com política de exceção |
| `STR-API-001` | P1 | Contratos | `NEEDS_ANALYSIS` | OpenAPI e compatibility guard backend/frontend |
| `STR-DB-001` | P1 | Banco | `NEEDS_ANALYSIS` | Testcontainers/PostgreSQL lane e Flyway clean-baseline determinístico |
| `STR-DATA-001` | P1 | Dados | `NEEDS_ANALYSIS` | fixtures sintéticas e guard contra credencial/dado real |
| `STR-OBS-001` | P1 | Observabilidade | `NEEDS_ANALYSIS` | correlação, métricas, SLO e runbook sem PII |
| `STR-WRK-001` | P1 | Worker | `NEEDS_ANALYSIS` | testes determinísticos de lease/retry/idempotência/shutdown |
| `STR-FE-001` | P1 | Frontend | `NEEDS_ANALYSIS` | acessibilidade, contrato visual e browser focado |
| `STR-SEC-002` | P1 | Supply chain | `NEEDS_ANALYSIS` | secret/SAST/container scanning sem chamada externa insegura |
| `STR-OPS-001` | P1 | Continuidade | `WAITING_FOR_DECISION` | rehearsal de restore e RPO/RTO documentados |
| `STR-PERF-001` | P2 | Performance | `NEEDS_ANALYSIS` | budgets backend/frontend/worker e baseline reproduzível |
| `STR-ARCH-001` | P2 | Arquitetura | `NEEDS_ANALYSIS` | ADRs, boundaries de módulos e detecção de dependência indevida |
| `STR-DOC-001` | P2 | Documentos | `NEEDS_ANALYSIS` | ciclo de retenção/integridade/storage auditável |
| `STR-REL-002` | P2 | Deploy | `BLOCKED_BY_OWNER` | promoção de imagens, provenance e rollback; aguarda PR `#56` |
| `STR-QA-001` | P2 | Qualidade | `NEEDS_ANALYSIS` | coverage agregado atual e ratchet baseado em medição real |

## Ordem recomendada

1. `STR-ORQ-001`, `STR-ORQ-002` e `STR-TEST-001`;
2. `STR-ORQ-003`, `STR-OWN-001` e `STR-RUN-001`;
3. `STR-REL-001`, `STR-SEC-001`, `STR-DATA-001`;
4. contratos, DB, worker, frontend, observabilidade e supply chain;
5. performance, arquitetura, continuidade e ratchets.

A seleção real deve reconciliar PRs/owners no momento do trigger.
