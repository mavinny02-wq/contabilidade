TASK: Reconciliar a versão 0.4.0 e as provas dos portais estaduais de São Paulo
TYPE: RECONCILIACAO / DOCUMENTACAO
BASELINE: latest main
EXECUTION MODE: CLOUD_FIRST
ITEMS: HIST-CRT-003, HIST-CRT-004

Leia `AGENTS.md`, documentação canônica, código integrado e evidências de validação local.

## Objetivo

Confirmar o que foi efetivamente integrado da v0.4.0, reconciliar os providers assistidos da
SEFAZ-SP e PGE-SP e preparar a próxima onda segura sem implementar novos portais nesta task.

## Regras

- não alterar produção;
- não criar, alterar ou executar testes;
- não marcar runtime, CAPTCHA ou PDF como validados sem evidência autorizada;
- preservar distinção entre bloqueio funcional, indisponibilidade e irregularidade fiscal;
- confirmar que PGE-SP permanece consolidada na matriz/CNPJ base;
- atualizar somente autoridades canônicas cujo estado mudou;
- executar validação documental/JSON e `git diff --check`.

## Saída

Baseline/Git, arquivos lidos, capacidades confirmadas, contradições, documentação atualizada,
provas pendentes, próxima onda proposta, overlap, arquivos alterados e Git final.
