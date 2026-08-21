# BUG-OPS-CONTABILIDADE-DEEPSEEK-PRO-FAIL-CLOSED-001 result

## Status

`IMPLEMENTADO_ESTRUTURALMENTE_VALIDADO; INTEGRACAO_PENDENTE`

## Baseline

`0a6f061a14253120711f170736687c027387f92f`

## Resultado

O runner próprio alinha o tier econômico e a autorização Pro ao contrato fail-closed aceito. Toda
implementação comum usa Flash. DeepSeek Pro só pode prosseguir com motivo fechado e autoridade
temporária; ausência de qualquer um encerra antes de rota/provider call. Motivo Pro em Flash também
falha. Sem chave, o fallback Codex permanece intacto quando não há argumento contraditório.

## Owners alterados

- `AGENTS.md`;
- `scripts/ai/contabilidade_llm_worker.py`;
- `scripts/ai/tests/test_contabilidade_llm_worker.py`;
- `docs/ai/CONTABILIDADE_OPTIONAL_EXTERNAL_LLM_WORKER_ROUTING.md`;
- `docs/ai/TEMPLATE_LAUNCHER_COMPACTO.md`;
- `docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md`;
- este RESULT_MD.

## Regressões

- activity routing mantém `test`, `triage`, `mechanical` e `implementation` em Flash;
- Pro sem motivo ou sem autoridade temporária falha antes de construir a rota/executor;
- `--pro-reason` em Flash falha com e sem chave;
- a autorização é consumida pelo runner e não segue para o ambiente filho;
- fallback Codex e isolamento de segredo anteriores permanecem cobertos.

## Validação

- `python -m py_compile` do runner e fixture: PASS;
- fixture focada do runner: PASS, 20 testes;
- AI/context suite consolidada: PASS, 37 testes em 0,565 s;
- context governance guard: PASS, zero erros/warnings;
- launcher compacto ativo: `PROMPT_VALID`;
- scorecard regenerado sem nova amostra e com hash inalterado
  `89D34CBCA617B8E191B22D048FC9EE3EFDBEA52BB7CDC1AF10FCAA764E660452`;
- secret/PII guard: PASS, zero findings;
- `git diff --check`: PASS;
- orchestration governance guard: FAIL preexistente com sete markers obsoletos/ausentes em
  `AGENTS.md`, current state e chat bootstrap; classificado para a auditoria estática sucessora,
  sem alterar o aceite deste owner porque o guard de contexto obrigatório passou.

## Limites

- nenhuma chamada de modelo, provider, push ou deploy nesta task;
- scorecard existente é regenerado sem adicionar amostra.
