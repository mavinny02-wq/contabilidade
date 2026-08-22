# Índice da documentação ativa

Este é um **índice de roteamento, não um bundle de contexto**. Não leia tudo. Comece pelo contrato da
raiz, escolha o objetivo e abra somente os documentos indicados.

## Entrada

- contrato geral: `../AGENTS.md`;
- contexto e tokens: `ai/CONTEXTO_E_ORCAMENTO.md`;
- nova conversa: `ai/CONTABILIDADE_NEW_CHAT_BOOTSTRAP.txt`;
- resync: `ai/CONTABILIDADE_EXISTING_CHAT_RESYNC.txt`;
- estado atual: `orquestracao/CONTABILIDADE_CURRENT_STATE.md`.

## Implementação

- backend: `../backend/AGENTS.md` + shard do owner;
- frontend: `../frontend/AGENTS.md` + shard do owner;
- worker: `../automation-worker/AGENTS.md` + shard do owner;
- scripts/startup: `../scripts/AGENTS.md` + gate/runbook específico;
- migrations: current state + registry Flyway + owner único.

## Operação e qualidade

- startup oficial: `orquestracao/STARTUP_RELIABILITY_GATE.md`;
- validação Cloud Docker/Compose liberada:
  `testing/plans/VAL_P0_CONTABILIDADE_DOCKER_COMPOSE_RUNTIME_001.md`;
- ledger de testes: `testing/MASTER_TEST_ORCHESTRATION.md`;
- locks: `decisoes/CONTABILIDADE_LOCKS_OPERACIONAIS.md`;
- owners/hotspots: `orquestracao/CONTABILIDADE_EXECUTION_OWNER_MATRIX.md`;
- backlog: `roadmap/BACKLOG_ESTRUTURAL.md`;
- roadmap 360: `roadmap/ROADMAP_360.md`.

## Próxima onda / reconciliação

Somente orquestração/reconciliação lê o checkpoint, manifests de wave e resultados afetados. Waves
consumidas e histórico permanecem COLD.

## Validação da documentação ativa

```text
python3 scripts/ai/context_governance_guard.py --repo-root .
python3 -m unittest discover -s scripts/ai/tests -p "test_*.py"
```
