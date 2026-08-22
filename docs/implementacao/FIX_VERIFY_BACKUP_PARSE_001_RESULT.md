# Resultado — FIX_VERIFY_BACKUP_PARSE_001

## Identificação

- **Item:** `FIX_VERIFY_BACKUP_PARSE_001`
- **Status:** `CONCLUÍDO_COM_LIMITAÇÃO_DE_AMBIENTE`
- **Classificação:** `PRODUCT_REGRESSION`
- **Baseline local:** `98650f2` (`Merge pull request #141 from mavinny02-wq/codex/review-contabilidade-docker-compose-release`)
- **Branch:** `fix/verify-backup-parse-001`
- **Owner:** correção do parser de `scripts/verify-backup.ps1` e regressão do preflight.
- **Locks:** nenhum lock adicional foi alterado.

## Escopo implementado

- `scripts/verify-backup.ps1`: converte `applicationVersion` uma vez para `string` e mantém `-or` no
  fim da primeira linha da condição, sem backtick e sem alterar mensagens ou o fluxo de validação.
- `scripts/tests/startup-preflight.Tests.ps1`: acrescenta regressão que usa
  `Parser::ParseFile` sobre o `verify-backup.ps1` real e exige zero erros.
- Nenhum backup ou restore real foi executado.

## Validação

| Comando | Resultado |
| --- | --- |
| `/tmp/pwsh/pwsh -NoLogo -NoProfile -Command '$tokens = $null; $errors = $null; [void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path ./scripts/verify-backup.ps1).Path, [ref]$tokens, [ref]$errors); if ($errors.Count -gt 0) { $errors \| Format-List \| Out-String \| Write-Error; exit 1 }; "Parser::ParseFile: 0 erros"'` | `PASS`: zero erros de parser. |
| `/tmp/pwsh/pwsh -NoLogo -NoProfile -Command 'Import-Module ./scripts/lib/startup-preflight.psm1 -Force; Invoke-StartupPowerShellPreflight -ScriptsPath ./scripts'` | `PASS`: 37 scripts validados. |
| `/tmp/pwsh/pwsh -NoLogo -NoProfile -Command 'Import-Module Pester -RequiredVersion 5.7.1 -Force; Invoke-Pester -Path ./scripts/tests/startup-preflight.Tests.ps1 -Output Detailed'` | `PARCIAL`: a nova regressão passou; 3 testes passaram e 1 teste preexistente falhou porque esperava linha 1, enquanto o parser reportou linha 3 para sua fixture. |
| `git diff --check` | `PASS`; apenas avisos informativos de normalização LF/CRLF foram emitidos. |

## Limitações

- O container Linux não possui Windows PowerShell 5.1. A validação estrutural foi executada com
  PowerShell 7.5.3; isso não comprova runtime Windows, embora a forma corrigida seja compatível com o
  parser solicitado e não use continuação por backtick.
- O teste Pester preexistente de localização da fixture permanece incompatível com o resultado do
  parser disponível no container. Ele não foi alterado para manter o patch restrito à regressão
  solicitada; a nova regressão sobre o arquivo real passou.
- Não havia remote Git configurado e o GitHub CLI não estava autenticado no ambiente no início da
  execução. A criação do PR depende da integração externa disponível após o commit.

## Integração

- **Commit:** commit desta task na branch `fix/verify-backup-parse-001`.
- **PR:** pendente de integração externa devido à ausência de remote/autenticação no ambiente.
