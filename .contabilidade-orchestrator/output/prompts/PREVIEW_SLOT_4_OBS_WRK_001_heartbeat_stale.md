# PREVIEW SLOT 4 — OBS-WRK-001

- **TASK:** classificar heartbeat vencido do automation worker
- **TYPE:** IMPLEMENTAÇÃO DE OBSERVABILIDADE
- **ITEM:** `OBS-WRK-001`
- **BASELINE:** futuro `main` após `GATE-VAL-001` verde
- **EXECUTION MODE:** CLOUD_FIRST

## Objetivo

Expor na Console Técnica o último heartbeat, idade, estado saudável/degradado/indisponível e motivo
seguro, sem confundir ausência de worker com falha fiscal.

## Caminhos próprios

- `backend/src/main/java/br/com/contabilidade/common/worker/**`;
- `backend/src/main/java/br/com/contabilidade/common/technical/**`;
- `frontend/src/pages/ConsoleTecnicaPage.tsx`;
- chaves i18n de Console Técnica;
- backlog Administração e uma evidência curta.

## Excluídos

Certidões, sessão interativa, documentos, backup, providers e migrations.

## Validação permitida

Compilação backend, frontend typecheck/build, i18n e `git diff --check`. Sem testes nesta task.
