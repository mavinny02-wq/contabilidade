# BUG-RUN-001 — completar evidência Windows de runtime

**Classificação:** `CANONICAL_CORRECTION_SHARD`  
**Prioridade:** P0  
**Baseline inspecionada:** `main@91a42c8e96775f2cbe3c09481beed879d4fbab31`

## Evidência do gap

O aceite original de `STR-RUN-001` exigia SHA, ferramentas, Compose efetivo, health, Flyway,
endpoints técnicos, smoke autorizado, JSON/Markdown, redaction e exit codes.

A implementação integrada coleta somente:

- sistema/PowerShell;
- Git e estado do repositório;
- versões Docker/Compose;
- status WSL;
- presença de algumas variáveis.

Ela não prova que a aplicação subiu.

## Objetivo

Evoluir o coletor para produzir evidência machine-readable do runtime Windows já iniciado, sem
alterar a aplicação e sem chamar provider externo.

## Escopo mínimo

- modo `dev` e `onpremise`;
- SHA e dirty state;
- versões Java/Maven/Node/npm/Docker/Compose/PowerShell;
- hash do Compose efetivo, sem persistir segredos;
- serviços esperados, container ID, status, health e exit code;
- confirmação de ausência de Keycloak/bootstrap em dev;
- backend liveness/readiness;
- worker `/health`;
- frontend `/healthz` e proxy `/api/info`;
- versão/sucesso mais recente do Flyway;
- estado Liquibase/Keycloak somente no modo onpremise;
- comparação opcional before/after para provar reuso do PostgreSQL no segundo startup;
- JSON fechado por schema e resumo Markdown;
- redaction e códigos de saída por categoria;
- nunca persistir `.env`, token, cookie, senha, certificado, path documental ou payload fiscal.

## Ownership

```text
scripts/orchestration/windows-evidence-collector.psm1
scripts/orchestration/collect-windows-evidence.ps1
scripts/orchestration/schemas/windows-evidence.schema.json
scripts/orchestration/tests/**windows-evidence*
docs/implementacao/BUG_RUN_001_RESULT.md
```

Não alterar startup, Compose, banco, aplicação ou deploy.

## Validação Cloud

- parser PowerShell;
- Pester com comandos Docker/HTTP/psql simulados;
- schema e fixtures válidas/inválidas;
- redaction;
- estados indisponível/erro/parcial;
- comparação de container IDs;
- `git diff --check`.

A prova real permanece `LOCAL_WINDOWS_MANUAL`.

## Resultado

`docs/implementacao/BUG_RUN_001_RESULT.md`
