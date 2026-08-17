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

### `UR-BUG-20260817-STARTUP-001`

```text
AREA: startup Windows/Compose
REPORTED_AT: 2026-08-17
BASELINE: main@a34afbe0c7a7876ea231c3a9a1c913dbe39928ae
ENVIRONMENT: host do usuário; detalhes completos não fornecidos nesta atualização
SYMPTOM: ambiente ainda não sobe
STEPS: executar o fluxo oficial de startup já reportado
EXPECTED: stack dev saudável e repetível
OBSERVED: startup continua sem concluir
EVIDENCE: relato textual do usuário; evidência anterior aponta falha no lifecycle do startup probe
SECURITY_REDACTION: nenhum segredo ou dado real incluído
EVIDENCE_BOUNDARY: não constitui prova runtime nem nova root cause
STATUS: SELECTED_AS_FIX_STARTUP_PROBE_001
```

Este intake é duplicata vinculada ao defeito canônico `FIX-STARTUP-PROBE-001`; ele não cria um
segundo owner.

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
