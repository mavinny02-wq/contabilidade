# Backlog estrutural do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_STRUCTURAL_REGISTRY`
**Atualizado em:** `2026-08-16`

Este arquivo é owner dos IDs estruturais. Registro não significa seleção ou execução.

## Status

- `IN_REVIEW_THIS_PR`: fundação presente nesta mudança;
- `READY_FOR_SELECTION`: contrato definido;
- `PREPARED_NOT_RELEASED`: candidato reservado, sem launcher executável;
- `IMPLEMENTED_PENDING_RUNTIME`: implementação integrada, prova do ambiente-alvo pendente;
- `NEEDS_ANALYSIS`: precisa shard/decisão;
- `WAITING_FOR_DECISION`: depende de decisão humana/ambiente;
- `BLOCKED_BY_OWNER`: owner aberto/reservado;
- `DONE`: evidência integrada e reconciliada.

## Itens

| ID | P | Área | Status | Resultado esperado |
|---|---:|---|---|---|
| `STR-ORQ-000` | P0 | Orquestração | `IN_REVIEW_THIS_PR` | checkpoint, locks, ledger, launchers compactos, guards e AGENTS hierárquicos |
| `STR-ORQ-001` | P0 | Git | `READY_FOR_SELECTION` | proteção da `main`, required checks e proibição operacional de push direto |
| `STR-ORQ-002` | P0 | Flyway | `DONE` | registry monotônico, hashes V1–V12, duplicata/retrocesso e lane única |
| `STR-TEST-001` | P0 | Evidência | `DONE` | gate legado decomposto por owner, ambiente, reuse e invalidação |
| `STR-ORQ-003` | P0 | Ondas | `READY_FOR_SELECTION` | manifests prepared/released/consumed validados deterministicamente |
| `STR-OWN-001` | P0 | Ownership | `READY_FOR_SELECTION` | CODEOWNERS/hotspots alinhados à matriz |
| `STR-SEC-001` | P0 | Segurança | `NEEDS_ANALYSIS` | guard de segredos/PII/logs com baseline e falso-positivo governado |
| `STR-RUN-001` | P0 | Runtime | `IMPLEMENTED_PENDING_RUNTIME` | coletor Windows seguro integrado; falta execução local |
| `BUG-INFRA-001` | P0 | Infra/CI | `PREPARED_NOT_RELEASED` | remover falso positivo de `Docker build` sem enfraquecer a proibição real |
| `STR-REL-001` | P1 | Release | `READY_FOR_SELECTION` | consistência de VERSION, pom, package, manifests e changelog |
| `STR-CTX-001` | P1 | Tokens | `NEEDS_ANALYSIS` | telemetria real do provedor e métricas por outcome |
| `STR-DEP-001` | P1 | Dependências | `NEEDS_ANALYSIS` | licença/SBOM/vulnerabilidade com política de exceção |
| `STR-API-001` | P1 | Contratos | `NEEDS_ANALYSIS` | OpenAPI e compatibility guard backend/frontend |
| `STR-DB-001` | P1 | Banco | `NEEDS_ANALYSIS` | PostgreSQL lane reproduzível e Flyway clean-baseline determinístico |
| `STR-DATA-001` | P1 | Dados | `NEEDS_ANALYSIS` | fixtures sintéticas e guard contra credencial/dado real |
| `STR-OBS-001` | P1 | Observabilidade | `NEEDS_ANALYSIS` | correlação, métricas, SLO e runbook sem PII |
| `STR-WRK-001` | P1 | Worker | `NEEDS_ANALYSIS` | testes determinísticos de lease/retry/idempotência/shutdown |
| `STR-FE-001` | P1 | Frontend | `NEEDS_ANALYSIS` | acessibilidade, contrato visual e browser focado |
| `STR-SEC-002` | P1 | Supply chain | `NEEDS_ANALYSIS` | secret/SAST/container scanning |
| `STR-OPS-001` | P1 | Continuidade | `WAITING_FOR_DECISION` | rehearsal de restore e RPO/RTO |
| `STR-PERF-001` | P2 | Performance | `NEEDS_ANALYSIS` | budgets backend/frontend/worker |
| `STR-ARCH-001` | P2 | Arquitetura | `NEEDS_ANALYSIS` | ADRs, boundaries e detecção de dependência indevida |
| `STR-DOC-001` | P2 | Documentos | `NEEDS_ANALYSIS` | retenção/integridade/storage auditável |
| `STR-REL-002` | P2 | Deploy | `BLOCKED_BY_OWNER` | promoção de imagens, provenance e rollback; aguarda PR `#56` |
| `STR-QA-001` | P2 | Qualidade | `NEEDS_ANALYSIS` | coverage agregado e ratchet baseado em medição real |

## Próxima ordem

1. concluir as PRs `#56` e `#57`;
2. liberar `CONTABILIDADE_STABILIZATION_WAVE_002`;
3. executar Windows dev com `STR-RUN-001`;
4. somente depois selecionar `STR-ORQ-003`, `STR-OWN-001`, `STR-REL-001` e `STR-ORQ-001`;
5. avançar para contratos, segurança, DB, observabilidade e coverage.
