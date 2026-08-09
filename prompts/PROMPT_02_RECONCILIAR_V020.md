TASK: Reconciliar a versão 0.2.0 integrada
TYPE: RECONCILIACAO / DOCUMENTACAO
BASELINE: latest main
EXECUTION MODE: CLOUD_FIRST
ITEMS: EPICO-COM-001, EPICO-EMP-001, EPICO-AUT-001, EPICO-CRT-001, EPICO-ADM-001

Leia todo `AGENTS.md`, documentação canônica e código integrado.

## Objetivo

Confirmar o que realmente entrou na `main`, atualizar os status permanentes e produzir a próxima
onda segura.

## Regras

- não alterar produção;
- não criar/alterar/executar testes;
- não considerar `VALIDACAO.md` como prova de runtime quando ela registrar apenas análise estrutural;
- manter conectores reais como pendentes;
- manter handoff de browser como pendente;
- não marcar lockfiles/build/runtime concluídos sem evidência;
- exatamente cinco slots independentes quando houver onda;
- sem dependência ou overlap;
- `git diff --check`.

## Saída

Baseline/Git, arquivos lidos, capacidades comprovadas, contradições, documentos alterados, provas
pendentes, onda proposta e Git final.
