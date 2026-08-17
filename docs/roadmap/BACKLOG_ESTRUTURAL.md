# Backlog estrutural do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_STRUCTURAL_REGISTRY`  
**Atualizado em:** `2026-08-17`

Registro não significa seleção. O gate P0 de startup tem precedência sobre waves já liberadas.

## Status

`RELEASED_FOR_EXECUTION`, `INCLUDED_IN_EXECUTABLE_OWNER`, `P0_BLOCKING`, `WAITING_FOR_FIX`, `READY_FOR_SELECTION`,
`RETURNED_TO_BACKLOG`, `WAITING_FOR_RUNTIME`, `WAITING_FOR_EXTERNAL_SETTING`, `DONE`,
`SUPERSEDED`.

## P0 — startup Windows/Compose

| ID | Estado | Resultado exigido |
|---|---|---|
| `CONTABILIDADE_STARTUP_RELIABILITY_GATE_P0_001` | `P0_BLOCKING` | primeiro e segundo startup Windows verdes |
| `FIX-STARTUP-PROBE-001` | `RELEASED_FOR_EXECUTION` | probe cleanup idempotente, race-safe e exit-code-driven |
| `STR-STARTUP-TEST-001` | `INCLUDED_IN_EXECUTABLE_OWNER` | harness inseparável de `FIX-STARTUP-PROBE-001` |
| `VAL-WINDOWS-COMPOSE-STARTUP-001` | `WAITING_FOR_FIX` | prova oficial em PowerShell 5.1/Docker Desktop |
| `BUG-RUN-001` | `DONE_RUNTIME_PENDING` | coletor Windows v2 para evidência final |

### Defeitos anteriores absorvidos

| ID | Estado | Observação |
|---|---|---|
| `FIX-BUILDKIT-DNS-001` | `SUPERSEDED` | DNS project-scoped removido |
| `FIX-BUILDKIT-DNS-002` | `DONE_RUNTIME_PENDING` | DNS/proxy sob Docker Desktop/daemon |
| `FIX-DOCKER-CONTEXT-001` | `DONE_RUNTIME_PENDING` | contexto ativo preservado |
| `FIX-POWERSHELL-COLON-001` | `DONE_RUNTIME_PENDING` | interpolação corrigida |
| `FIX-STARTUP-PREFLIGHT-001` | `DONE_WINDOWS_PROOF_PENDING` | parse-all antes de build |

Nenhum desses resultados, isoladamente, prova que a stack oficial sobe.

## Governança e engenharia concluídas

| Grupo | Estado | Resultado |
|---|---|---|
| `STR-ORQ-000/002/003`, `STR-OWN-001` | `DONE` | checkpoint, waves, Flyway lane e CODEOWNERS |
| `STR-CI-001/002` | `DONE_REMOTE_EVIDENCE_BLOCKED` | workflow estático; run remota não observada |
| `STR-SEC-001/002/003` | `DONE` | segredo/PII, supply chain e lifecycle de segredo |
| `STR-DB-001` | `DONE_DOCKER_PROOF_PENDING` | PostgreSQL/Testcontainers implementado |
| `STR-QA-001`, `STR-QA-FE-002`, `STR-QA-WRK-002` | `DONE` | coverage e ratchets |
| `STR-API-001/002` | `DONE` | OpenAPI e consumer contracts |
| `STR-OBS-001/002` | `DONE` | correlação, métricas, SLOs e alertas |
| `STR-ARCH-*` | `DONE` | 601 arestas e zero findings |
| `STR-REL-003` | `DONE` | promoção/rollback offline |
| `STR-OPS-002` | `DONE` | recovery planner offline |
| `FIX-TECH-AUTH-001` | `DONE` | negação de acesso retorna 403 |

## Wave 012 superseded pelo P0

| Item | Estado após hold |
|---|---|
| `VAL-W011-FULLSTACK-012` | `DONE_TEST_CONTRACT_DRIFT` — Cloud verde nos gates executados; `/healthz` Nginx não provado |
| `STR-INF-002` | `RETURNED_TO_BACKLOG` |
| `STR-INF-003` | `RETURNED_TO_BACKLOG` |
| `STR-CI-003` | `RETURNED_TO_BACKLOG` |
| `STR-OBS-003` | `RETURNED_TO_BACKLOG` |

Esses quatro itens não podem ser executados até a remoção do hold.

## Pendências estruturais após o P0

| ID | Estado | Resultado |
|---|---|---|
| `STR-INF-002` | `READY_FOR_SELECTION_AFTER_P0` | TLS/cert lifecycle |
| `STR-INF-003` | `READY_FOR_SELECTION_AFTER_P0` | IaC on-premise drift guard |
| `STR-CI-003` | `READY_FOR_SELECTION_AFTER_P0` | paridade local do Required CI |
| `STR-OBS-003` | `READY_FOR_SELECTION_AFTER_P0` | synthetic monitoring local-only |
| `STR-DOC-003` | `NEEDS_ANALYSIS` | antimalware e quarentena |
| `STR-DOC-004` | `NEEDS_ANALYSIS` | storage remoto |
| `STR-DOC-005` | `WAITING_FOR_DECISION` | retenção/descarte |
| `STR-OPS-001` | `WAITING_FOR_RUNTIME` | restore real e RPO/RTO |
| `STR-REL-002` | `WAITING_FOR_RUNTIME` | promoção/rollback reais |
| `STR-ORQ-001`, `STR-QA-002` | `WAITING_FOR_EXTERNAL_SETTING` | branch protection/check remoto |

## Campanhas externas

- `VAL-QA-BE-DOCKER-001`: executor Java 21 + Docker;
- on-premise + Keycloak: somente depois de dev e segundo startup verdes;
- Required CI remoto/branch protection: configuração externa;
- providers reais/pagos: não autorizados.

## Regra de seleção temporária

```text
WINDOWS_COMPOSE_STARTUP_GATE != PASS
  -> nenhuma wave funcional/estrutural comum
  -> nenhuma funcionalidade nova
  -> somente CONTABILIDADE_STARTUP_RECOVERY_WAVE_013
  -> um owner serial: FIX-STARTUP-PROBE-001 + harness/testes inseparáveis
```

`BACKLOG_ESTRUTURAL_STARTUP_RECOVERY_WAVE_013_RELEASED`
