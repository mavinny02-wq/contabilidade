TASK: Reconciliar a baseline 0.1 integrada
TYPE: RECONCILIACAO / DOCUMENTACAO
BASELINE: latest main
EXECUTION MODE: CLOUD_FIRST
ITEM: HIST-FND-001

Leia todo `AGENTS.md`, documentação canônica e o código integrado.

## Objetivo

Confirmar o que foi efetivamente integrado da baseline 0.1, corrigir o estado documental e preparar
a primeira onda segura de cinco slots independentes.

## Regras

- não alterar produção;
- não criar/alterar/executar testes;
- validar estrutura, links, JSON e `git diff --check`;
- não marcar prova pendente como concluída sem evidência;
- não colocar dependências na mesma onda;
- definir propriedade exclusiva de arquivos e migrations;
- não selecionar sucessor automaticamente além da onda aprovada.

## Saída

Baseline/Git, arquivos lidos, capacidades confirmadas, contradições, docs atualizados, provas
pendentes, primeira onda proposta, overlap, arquivos alterados e Git final.
