# Intake de bugs, incidentes e melhorias reportados pelo usuário

**Classificação:** `CANONICAL_ACTIVE_USER_REPORTED_INTAKE`
**Owner:** `ORCHESTRATOR`

Este ledger preserva evidência; não é fila executável.

## Regras

- Registre sintoma, ambiente, data, baseline conhecida, passos, resultado e evidência fornecida.
- Não invente root cause.
- Uma resposta HTTP bem-sucedida com warning não vira falha funcional automaticamente.
- Evidência nova não é apagada porque um PR/teste antigo alegou correção.
- Capture não seleciona task, não reserva owner, não cria migration e não consome slot.
- Launcher de correção só nasce por seleção explícita posterior.
- Dados pessoais, tokens, cookies, documentos e payloads fiscais devem ser redigidos.
- Duplicatas apontam para um ID canônico.

## Intake ativo

Nenhum item foi migrado automaticamente dos documentos históricos nesta fundação. Novos relatos
devem receber IDs `UR-BUG-*`, `UR-INC-*`, `UR-PERF-*` ou `UR-IMP-*`.

## Template

```text
ID:
AREA:
REPORTED_AT:
BASELINE:
ENVIRONMENT:
SYMPTOM:
STEPS:
EXPECTED:
OBSERVED:
EVIDENCE:
SECURITY_REDACTION:
EVIDENCE_BOUNDARY:
STATUS: CAPTURED_NOT_SELECTED
```
