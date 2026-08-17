# Contabilidade Fast Lane Wave 010 — consumida

**Status:** `CONSUMED`  
**Baseline:** `main@d14e8624cafb23462abc3cc693a798459fcd870e`  
**PRs integradas:** `#122–#126`  
**Migration owner:** `NONE`

## Resultado

| ITEM | Resultado | Disposição |
|---|---|---|
| `FIX-SEC-IAM-001` | converter JWT fail-closed; guard IAM e 14 testes verdes | `PASS` |
| `FIX-STARTUP-PREFLIGHT-001` | parse-all antes do build; prova PowerShell 5.1 pendente | `PASS_STRUCTURAL_WINDOWS_RUNTIME_PENDING` |
| `VAL-TECH-CONSOLE-CURRENT-001` | contratos atuais passam; negação de method security retorna 500 | `FIX_PRODUCT` |
| `STR-ARCH-BE-004` | Certidão isolada de Empresa; findings 4 → 1 | `PASS_STRUCTURAL` |
| `STR-INF-001` | guard dev/on-premise/CI determinístico | `PASS_STRUCTURAL` |

## Reconciliação

A onda está terminal e não pode ser relançada. O único defeito de produto comprovado é o mapeamento
de `AccessDeniedException` para HTTP 500; ele foi promovido para `FIX-TECH-AUTH-001`.

A ausência de Docker no teste PostgreSQL da Console Técnica e a ausência de PowerShell no executor
são `ENVIRONMENT_LIMITATION`. As provas permanecem nas campanhas runtime existentes e não ocupam
slot da próxima wave.

`CONTABILIDADE_FAST_LANE_WAVE_010_CONSUMED`
