# FIX-STARTUP-PREFLIGHT-001 — resultado

## Identificação

- **ITEM:** `FIX-STARTUP-PREFLIGHT-001`
- **WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_010`
- **CONTRACT:** `2.0`
- **BASELINE assinada da onda:** `d14e8624cafb23462abc3cc693a798459fcd870e`
- **HEAD inicial (latest main disponível):** `507a09610700a16415860f5d966e3a9cda17b377`
- **DISPATCH_KEY:** `de4b84436b331c1cbc4c6fd4c393f32c5987c99c442b029e6039538c0bc4a4d5`
- **STATUS:** `PASS_STRUCTURAL_WINDOWS_RUNTIME_PENDING`
- **MIGRATION:** nenhuma

## Entrega

- O startup importa e executa um preflight antes de procurar Java/Node ou invocar Maven, npm e
  builds Docker.
- O preflight enumera recursivamente `.ps1` e `.psm1` sob `scripts/`, em ordem determinística, e
  usa `System.Management.Automation.Language.Parser.ParseFile`.
- Erros exibem somente caminho, linha, coluna e mensagem do parser; um ou mais erros encerram o
  startup antes do build, sem dump de ambiente, `.env` ou configuração Docker.
- A regressão Pester cobre arquivos em caminho com espaços, erro sintético, saída diagnóstica e a
  precedência do parse sobre ferramentas/build. O guard Node de interpolação ambígua permanece
  ativo e agora também fixa a precedência estrutural do preflight.
- O guard encontrou uma interpolação ambígua preexistente em `gerar-lockfiles.ps1`, classificada
  como `PRODUCT_REGRESSION`; ela foi delimitada sem mudar o comportamento pretendido.

## Owners e locks preservados

- **Owners alterados:** parser/preflight, startup tests/guard e este resultado.
- Compose, Docker context/builder, backend, frontend, worker, banco, migrations e dependências de
  produto permaneceram read-only.
- `LOCK-DEP-001`: implementação local, compatível com Windows PowerShell 5.1 e PowerShell 7, sem
  dependência nova.
- `LOCK-ENV-001`: a validação Linux não é apresentada como prova de Windows/Docker Desktop.
- `LOCK-EVID-001`: checks focados e determinísticos; nenhuma reconstrução de imagem foi executada.
- `LOCK-TEST-001`: o finding do guard foi classificado antes da correção delimitada; indisponibilidade
  de PowerShell/Pester no executor foi classificada como `ENVIRONMENT_LIMITATION`.

## Validação executada

| Comando | Resultado |
|---|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_FAST_LANE_WAVE_010 --item FIX-STARTUP-PREFLIGHT-001 --baseline d14e8624cafb23462abc3cc693a798459fcd870e --key de4b84436b331c1cbc4c6fd4c393f32c5987c99c442b029e6039538c0bc4a4d5 --github-aware --register` | `DISPATCH_ALLOWED`; auditoria remota indisponível sem variáveis GitHub |
| `node scripts/codex/validate-docker-orchestration.mjs` | PASS; parse-first, guard `$variavel:` e invariantes Docker preservados |
| `node --test scripts/codex/validate-docker-orchestration.test.mjs` | PASS; 4/4 testes |
| `git diff --check` | PASS |
| `Invoke-Pester scripts/tests/startup-preflight.Tests.ps1` | `ENVIRONMENT_LIMITATION`; não há `powershell`/`pwsh` neste executor Linux |

## Limitações e provas pendentes

- A execução do parse-all e da suíte Pester em Windows PowerShell 5.1 permanece pendente no host
  Windows. Os testes foram escritos com sintaxe compatível, mas validação estrutural Linux não
  substitui essa prova.
- Nenhum Maven, npm, Docker build, Docker context/builder, Compose ou runtime de produto foi
  executado, conforme o escopo de validação focada.

## Commit e PR

- Commit: `fix: parse PowerShell scripts before startup builds`.
- PR: `NOT_CREATED_ENVIRONMENT_LIMITATION`; a ferramenta obrigatória `make_pr` não está disponível
  nesta sessão e o checkout não possui remote Git configurado.
