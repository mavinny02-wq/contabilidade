# PREVIEW SLOT 1 — SEC-AUT-001

- **TASK:** implementar anti-replay de tickets da sessão interativa
- **TYPE:** IMPLEMENTAÇÃO DE SEGURANÇA
- **ITEM:** `SEC-AUT-001`
- **BASELINE:** futuro `main` após `GATE-VAL-001` verde
- **EXECUTION MODE:** CLOUD_FIRST

## Objetivo

Tornar cada `jti` de ticket de sessão interativa consumível uma única vez ou rotacionável, mantendo
expiração, vínculo de usuário, execução, intervenção e sessão.

## Caminhos próprios

- `backend/src/main/java/br/com/contabilidade/common/remote/**`;
- `automation-worker/src/SessionTicket.ts`;
- migration `V8__interactive_session_ticket_replay.sql` somente se persistência for necessária;
- backlog Automação e uma evidência curta.

## Excluídos

Frontend, Certidões, providers, documentos, backup e Console Técnica.

## Segurança

Não enfraquecer HMAC, expiração ou autorização. Não registrar ticket bruto em logs.

## Validação permitida

Compilação backend/worker, build e `git diff --check`. Não criar/executar testes nesta task.
