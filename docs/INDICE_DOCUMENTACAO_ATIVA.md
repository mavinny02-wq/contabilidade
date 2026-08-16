# Índice da documentação ativa

**Classificação:** `CANONICAL_ACTIVE_ROUTER`

Este arquivo é um índice de roteamento, não um bundle de contexto. Não leia recursivamente todos os
links.

## Entrada canônica

- estado atual: [CONTABILIDADE_CURRENT_STATE](orquestracao/CONTABILIDADE_CURRENT_STATE.md);
- governança: [GOVERNANCA_DOCUMENTACAO](GOVERNANCA_DOCUMENTACAO.md);
- ondas: [CONTABILIDADE_WAVE_ORCHESTRATION_V2](orquestracao/CONTABILIDADE_WAVE_ORCHESTRATION_V2.md);
- ownership: [CONTABILIDADE_EXECUTION_OWNER_MATRIX](orquestracao/CONTABILIDADE_EXECUTION_OWNER_MATRIX.md);
- intake: [CONTABILIDADE_USER_REPORTED_INTAKE](orquestracao/CONTABILIDADE_USER_REPORTED_INTAKE.md);
- testes/evidências: [MASTER_TEST_ORCHESTRATION](testing/MASTER_TEST_ORCHESTRATION.md);
- classificação de evidência: [EVIDENCE_CLASSIFICATION](testing/EVIDENCE_CLASSIFICATION.md);
- locks: [CONTABILIDADE_LOCKS_OPERACIONAIS](decisoes/CONTABILIDADE_LOCKS_OPERACIONAIS.md);
- backlog estrutural: [BACKLOG_ESTRUTURAL](roadmap/BACKLOG_ESTRUTURAL.md);
- maturidade: [ROADMAP_MATURIDADE_ORQUESTRACAO](roadmap/ROADMAP_MATURIDADE_ORQUESTRACAO.md).

## Rotas de leitura

### Executor comum

Não use este índice quando o launcher já fornece shard e lock exatos. Leia somente raiz + nearest
`AGENTS.md`, launcher, shard e locks mapeados.

### Próxima onda / reconciliação

Leia:

1. este índice;
2. checkpoint atual;
3. HEAD, PRs abertas e delta desde o último SHA reconciliado;
4. `RESULT_MD` introduzidos pelo delta;
5. shards/sucessores e locks afetados;
6. ledger de testes somente quando a seleção envolve prova.

Não escaneie histórico, todos os backlogs ou toda a árvore de análise.

### Documentação

Adicione `docs/AGENTS.md` e este documento de governança.

### Validação

Adicione `docs/testing/AGENTS.md`, o master ledger e somente o owner de prova liberado.

## Produto e arquitetura

- [Visão do Produto](visao/VISAO_PRODUTO.md)
- [Escopo](visao/ESCOPO.md)
- [Arquitetura Base](arquitetura/ARQUITETURA_BASE.md)
- [Modelo de Domínio](arquitetura/MODELO_DOMINIO.md)
- [Integrações e Providers](arquitetura/ARQUITETURA_INTEGRACOES.md)
- [Automação Playwright](arquitetura/AUTOMACAO_PLAYWRIGHT.md)
- [Documentos e Evidências](arquitetura/DOCUMENTOS_E_EVIDENCIAS.md)
- [Segurança](arquitetura/SEGURANCA.md)
- [Observabilidade](arquitetura/OBSERVABILIDADE.md)

## Produto e backlogs

- [Registro de Itens do Roadmap](roadmap/REGISTRO_ITENS_ROADMAP.md)
- [Roadmap do Produto](roadmap/ROADMAP_PRODUTO.md)
- [Common](roadmap/BACKLOG_COMMON.md)
- [Empresas](roadmap/BACKLOG_EMPRESAS.md)
- [Automação](roadmap/BACKLOG_AUTOMACAO.md)
- [Certidões](roadmap/BACKLOG_CERTIDOES.md)
- [Integrações](roadmap/BACKLOG_INTEGRACOES.md)
- [Administração](roadmap/BACKLOG_ADMINISTRACAO.md)

## Operação

- [Instalação on-premise](operacao/INSTALACAO_ON_PREMISE.md)
- [Backup e restauração](operacao/BACKUP_E_RESTAURACAO.md)
- [Atualização e rollback](operacao/ATUALIZACAO_E_ROLLBACK.md)
- [Runbook](operacao/RUNBOOK.md)
- [Validação runtime v0.5.1](operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md)

## IA e Codex

- [Contexto e orçamento](ai/CONTEXTO_E_ORCAMENTO.md)
- [Bootstrap de chat](ai/CHAT_BOOTSTRAP.md)
- [Template de launcher](ai/TEMPLATE_LAUNCHER_COMPACTO.md)
- [Fluxo Codex](ai/FLUXO_TRABALHO_CODEX.md)
- [Regras de tasks](ai/REGRAS_TASKS_CODEX.md)
- [Padrões de prompts](ai/PADROES_PROMPTS.md)
