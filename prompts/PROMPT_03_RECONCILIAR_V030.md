TASK: Reconciliar a versão 0.3.0 e a prova do portal Federal
TYPE: RECONCILIACAO / DOCUMENTACAO
ITEM: HIST-CRT-002
BASELINE: latest main
EXECUTION MODE: CLOUD_FIRST

Leia `AGENTS.md`, as autoridades canônicas, o código integrado e as evidências de validação local/runtime fornecidas.

## Objetivo

Confirmar o que foi integrado da v0.3.0, reconciliar a sessão interativa e o provider Federal e preparar a próxima onda segura sem implementar SEFAZ-SP ou PGE-SP nesta task.

## Evidências esperadas

- compilação Maven;
- lockfiles e builds frontend/worker;
- `docker compose config`;
- Flyway/PostgreSQL;
- Keycloak;
- health do worker com `FEDERAL_PORTAL::CERTIDAO_FEDERAL_RFB_PGFN`;
- execução autorizada com ou sem CAPTCHA;
- captura/upload do PDF;
- resultado normalizado;
- eventuais amostras autorizadas de CND/CPEND.

## Regras

- não alterar produção;
- não criar ou executar testes nesta reconciliação;
- não declarar runtime verde sem evidência;
- preservar IDs permanentes;
- manter SEFAZ-SP e PGE-SP fora da seleção até o Federal estar reconciliado;
- executar validações documentais e `git diff --check`.

## Saída

Baseline/Git, arquivos lidos, evidências, capacidades confirmadas, contradições, status atualizado, provas ainda pendentes, próxima onda proposta, arquivos alterados e Git final.
