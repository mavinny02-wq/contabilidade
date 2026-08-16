# Regras de agentes — documentação

Este arquivo especializa o contrato da raiz para `docs/**`.

## Autoridade e ciclo de vida

- Leia `docs/GOVERNANCA_DOCUMENTACAO.md` e apenas o owner documental exato.
- `docs/INDICE_DOCUMENTACAO_ATIVA.md` é índice de roteamento, não bundle obrigatório.
- Estado dinâmico fica em `docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md`.
- Evidência de testes fica em `docs/testing/MASTER_TEST_ORCHESTRATION.md`.
- IDs estruturais ficam em `docs/roadmap/BACKLOG_ESTRUTURAL.md`.
- Não reescreva evidência histórica para representar estado atual; marque supersession e crie
  documento atual.
- Documentos históricos nunca selecionam trabalho.

## Trabalho documentation-only

Análise, decisão, intake, reconciliação, backlog e seleção que alteram apenas Markdown são owned pelo
orquestrador. Não crie launcher Codex para documentação que o orquestrador consegue escrever
diretamente.

## Economia e consistência

- Não replique o mesmo fato dinâmico em índice, board, backlog, prompt e checkpoint.
- Prompts são launchers; detalhes pertencem ao shard canônico.
- Não declare integrado, validado ou fechado sem prova no GitHub/ledger correspondente.
- Mantenha links relativos e classificação/status explícitos.
