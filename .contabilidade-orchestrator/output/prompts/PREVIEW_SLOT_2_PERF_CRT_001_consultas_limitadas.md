# PREVIEW SLOT 2 — PERF-CRT-001

- **TASK:** limitar consultas globais do scheduler do Centro de Certidões
- **TYPE:** IMPLEMENTAÇÃO DE PERFORMANCE
- **ITEM:** `PERF-CRT-001`
- **BASELINE:** futuro `main` após `GATE-VAL-001` verde
- **EXECUTION MODE:** CLOUD_FIRST

## Objetivo

Substituir cargas globais não limitadas por consultas paginadas/bounded para agendamento e
reconciliação de certidões, preservando estados e idempotência.

## Caminhos próprios

- `backend/src/main/java/br/com/contabilidade/certidao/**`;
- repositories específicos de estabelecimento usados pelo scheduler;
- backlog Certidões e uma evidência curta.

## Excluídos

Remote session, worker, documentos, backup, Console Técnica e migrations.

## Validação permitida

Compilação backend e `git diff --check`. Não criar/executar testes nesta task.
