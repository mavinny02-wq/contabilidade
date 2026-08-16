# Regras de agentes — orquestração

Este arquivo especializa `docs/AGENTS.md` para `docs/orquestracao/**`.

- GitHub é a verdade de integração: confira HEAD, PRs abertas e delta antes de alterar estado.
- O checkpoint deve ser compacto e conter somente baseline reconciliado, owners abertos/reservados,
  frontier de migration, gates, campanhas e próxima transição.
- Não copie logs, screenshots, prompts completos ou história extensa para o checkpoint.
- PR/owner aberto é reserva, não produto integrado.
- Uma onda `PREPARED_NOT_RELEASED` não contém launcher executável.
- Uma onda `RELEASED_FOR_EXECUTION` contém no máximo cinco owners totais e no máximo um owner de
  migration.
- Reconcile apenas o delta desde o último SHA; use modo deep somente pelos triggers canônicos.
- Intake de bug preserva evidência, mas não seleciona correção automaticamente.
