# VAL-STAB-INFRA-CONTRACT-001 — validação dos contratos de infraestrutura

## Identificação

- **Task:** `VAL-STAB-INFRA-CONTRACT-001`
- **Baseline recebido:** `7c6079c3bc71739572d2dc8cdd85196053b16017` (`Merge PR #55: isola BuildKit e separa deploy sem build`)
- **Branch preparada:** `infra-validation`
- **Data da execução:** 2026-08-16 (UTC)
- **Locks respeitados:** `LOCK-DEP-001`, `LOCK-EXT-001`, `LOCK-ENV-001` e `LOCK-TEST-001`
- **Escopo de escrita:** somente este relatório; Compose, startup e deploy permaneceram somente leitura.

## Arquivos lidos

- `AGENTS.md`;
- `.github/workflows/build.yml`;
- `compose.yaml`;
- `compose.dev.yaml`;
- `compose.onpremise.yaml`;
- `scripts/codex/validate-docker-orchestration.mjs`, para reproduzir o contrato chamado pelo workflow;
- `.env.example`, usado apenas como arquivo de interpolação nas tentativas de `compose config`;
- `scripts/AGENTS.md` foi procurado conforme a task, mas não existe no baseline recebido.

## Resultado executivo

**Resultado geral: bloqueado/reprovado.** O contrato Docker executável do workflow falha no baseline. As outras três verificações solicitadas não puderam produzir um parecer sobre os arquivos porque o ambiente não contém `pwsh` nem Docker CLI/Compose.

A falha do contrato Docker é reproduzível e ocorre na asserção que proíbe `docker build` no script de deploy. O padrão também reconhece a frase operacional `Nenhum build sera executado neste servidor.` presente em `scripts/deploy-contabilidade-onpremise.ps1`; portanto, a validação falha mesmo sem demonstrar a execução de um comando de build. Nenhum arquivo sob os locks foi corrigido nesta task de validação somente leitura.

## Evidências das validações

| Verificação | Comando | Exit code | Resultado observado |
| --- | --- | ---: | --- |
| Contrato Docker do workflow | `node scripts/codex/validate-docker-orchestration.mjs` | 1 | **Reprovado.** `AssertionError [ERR_ASSERTION]` na asserção `doesNotMatch` aplicada ao deploy; o texto capturado inclui `Nenhum build sera executado neste servidor.` |
| Parser PowerShell | `pwsh -NoLogo -NoProfile -NonInteractive -Command '$errors = @(); Get-ChildItem -Path . -Recurse -File -Filter *.ps1 \| ForEach-Object { [void][System.Management.Automation.Language.Parser]::ParseFile($_.FullName, [ref]$null, [ref]$fileErrors); $errors += $fileErrors }; if ($errors.Count -gt 0) { $errors \| Format-List; exit 1 }'` | 127 | **Não executado por limitação do ambiente.** `/bin/bash: pwsh: command not found`. |
| Compose de desenvolvimento | `docker compose --env-file .env.example -f compose.yaml -f compose.dev.yaml config --quiet` | 127 | **Não executado por limitação do ambiente.** `/bin/bash: docker: command not found`. |
| Compose on-premise | `docker compose --env-file .env.example -f compose.yaml -f compose.onpremise.yaml config --quiet` | 127 | **Não executado por limitação do ambiente.** `/bin/bash: docker: command not found`. |

O Node.js disponível foi `v20.20.2`, enquanto o workflow configura Node.js 24. A falha observada é uma incompatibilidade textual explícita da asserção com o conteúdo analisado, não uma mensagem de incompatibilidade de runtime. Ainda assim, a reprodução definitiva em paridade com o runner deve usar Node.js 24.

## Comportamento preservado

- Nenhum Compose, script de startup/deploy, workflow, dependência, configuração de ambiente ou teste foi alterado.
- Nenhum serviço, container, volume ou banco foi iniciado ou modificado.
- Nenhum segredo real foi criado ou registrado; `.env.example` foi somente lido.
- Os estados de desenvolvimento e on-premise continuam distintos; a ausência do Docker foi registrada como indisponibilidade da validação, e não como aprovação ou reprovação dos modelos Compose.

## Pendências e encaminhamento

1. Em uma task separada de correção, restringir o detector do contrato a invocações reais de `docker build`/`docker buildx`, sem classificar mensagens descritivas como comandos.
2. Reexecutar o contrato com Node.js 24 após a correção.
3. Reexecutar o parser em ambiente com PowerShell (preferencialmente Windows PowerShell 5.1 e PowerShell 7, conforme compatibilidade pretendida).
4. Reexecutar ambos os `docker compose ... config --quiet` em ambiente com Docker CLI e Compose v2.

## Arquivos alterados

- `docs/testing/runs/VAL_STAB_INFRA_CONTRACT_001.md` (novo; relatório de validação).
