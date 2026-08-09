# PREVIEW SLOT 5 — SEC-DOC-001

- **TASK:** verificar integridade do documento antes do download
- **TYPE:** IMPLEMENTAÇÃO DE SEGURANÇA
- **ITEM:** `SEC-DOC-001`
- **BASELINE:** futuro `main` após `GATE-VAL-001` verde
- **EXECUTION MODE:** CLOUD_FIRST

## Objetivo

Recalcular SHA-256 do arquivo armazenado antes do download, recusar conteúdo divergente, registrar
ocorrência auditável e não apagar automaticamente a evidência comprometida.

## Caminhos próprios

- `backend/src/main/java/br/com/contabilidade/common/document/**`;
- mensagens backend relacionadas;
- backlog Common e uma evidência curta.

## Excluídos

Frontend, worker, certidões, sessão interativa, backup, Console Técnica e migrations.

## Validação permitida

Compilação backend e `git diff --check`. Não criar/executar testes nesta task.
