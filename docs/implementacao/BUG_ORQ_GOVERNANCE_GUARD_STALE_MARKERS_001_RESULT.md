# BUG-ORQ-GOVERNANCE-GUARD-STALE-MARKERS-001 result

## Status

`IMPLEMENTADO_ESTRUTURALMENTE_VALIDADO; INTEGRACAO_PENDENTE`

## Baseline

`8bdabf7d4071d9b2176d9487c2aba5095514db18`

## Classificação

`BASELINE_DRIFT_IN_BLOCKING_GUARD`

O required guard de orquestração falhava no próprio `main` porque exigia sete frases de versões
anteriores do AGENTS, checkpoint e bootstrap. A documentação atual já usava contratos canônicos
equivalentes ou mais específicos; mudar os documentos para frases históricas regrediria o
roteamento atual.

## Correção

- markers passam a representar o contrato canônico vigente e usam comparação case-insensitive;
- checkpoint registra explicitamente zero PRs abertas, comprovado por consulta GitHub read-only;
- bootstrap exige os dois prompts estáveis e o guard de contexto atual, não headings antigos;
- nenhum gate é removido: ausência de qualquer marker atual continua bloqueante e acionável.

## Owners alterados

- `scripts/orchestration/validate_orchestration_governance.py`;
- `scripts/orchestration/test_validate_orchestration_governance.py`;
- `docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md`;
- este RESULT_MD.

## Regressões

- o repositório canônico atual precisa passar;
- matching de marker não depende de caixa;
- somente os markers antigos de chat não podem mascarar drift do contrato atual;
- limite de migration owner anterior permanece coberto.

## Validação

- GitHub read-only: zero PRs abertas; `origin/main` em
  `bb55cbb9f019914ca454871776f23d886a811b6b`;
- `python -m py_compile` do guard e fixture: PASS;
- fixture focada: PASS, 4 testes em 0,029 s;
- orchestration governance guard: PASS, zero erros/warnings;
- suite estática de orquestração: PASS, 32 testes em 1,557 s;
- wave manifests: PASS, zero erros;
- bootstrap, resync e launcher ativo: `PROMPT_VALID` nos três owners;
- AI/context suite: PASS, 37 testes em 0,807 s;
- context governance guard: PASS, zero erros/warnings;
- secret/PII guard: PASS, zero findings;
- `git diff --check`: PASS.

## Limites

- nenhuma chamada LLM, Docker, serviço, push ou deploy;
- zero PRs abertas é evidência pontual de `2026-08-21`, não garantia futura.
