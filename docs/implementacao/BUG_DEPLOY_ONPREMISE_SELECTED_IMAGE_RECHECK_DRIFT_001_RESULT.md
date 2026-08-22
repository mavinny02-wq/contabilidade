# BUG-DEPLOY-ONPREMISE-SELECTED-IMAGE-RECHECK-DRIFT-001 — resultado

- **Status:** `IMPLEMENTED_STRUCTURAL_GREEN_RUNTIME_PENDING`
- **Classificação:** `PRODUCT_REGRESSION`
- **Baseline:** `d94dfcaf486b9b98406aba694d1ad6edd1d3f61c`

## Causa

O deploy on-premise resolve `CONTABILIDADE_*_IMAGE`, opcionalmente exige digest, valida que cada
imagem escolhida existe e grava essas referências no override Compose. Em seguida chamava
`start-compose-sequential.bat`, que ignorava essa seleção durante o preflight e verificava novamente
as tags locais `contabilidade-*:VERSION`.

Assim, um conjunto válido de imagens de registry fixadas por digest podia ser aceito pelo deploy e
depois bloqueado porque uma tag local não relacionada estava ausente.

## Correção e regressão

O deploy agora passa as três referências selecionadas ao `verify-runtime-images.ps1` canônico e,
após essa prova de conteúdo, chama diretamente
`start-compose-sequential.ps1 -Mode onpremise -NoExit`. O script sequencial usa o override já
validado e retorna uma evidência de conclusão; ausência desse resultado falha fechada. O BAT continua
sendo o entrypoint do fluxo local, mas não reinterpreta as imagens do deploy publicado.

O guard Docker possui uma regressão direta que exige a verificação das três referências escolhidas
antes da chamada PowerShell com `onpremise`/`NoExit` e rejeita o retorno ao BAT que recalcula tags
locais.

## Owners e locks

- `scripts/deploy-contabilidade-onpremise.ps1`;
- `scripts/codex/validate-docker-orchestration.mjs`;
- `scripts/codex/validate-docker-orchestration.test.mjs`;
- este `RESULT_MD`;
- `LOCK-STARTUP-001`, `LOCK-ENV-001`, `LOCK-TEST-001`, `LOCK-EVID-001` e `LOCK-GIT-001`
  preservados.

## Evidência e limitação

- `node --test scripts/codex/validate-docker-orchestration.test.mjs` — `PASS`, 10 testes;
- `node scripts/codex/validate-docker-orchestration.mjs` — `PASS`;
- `node --test scripts/codex/validate-startup-actions.test.mjs` — `PASS`, 9 testes;
- `node scripts/codex/validate-startup-actions.mjs` — `PASS`;
- parser Windows PowerShell 5.1 do deploy — `PASS`;
- testes do contrato Required CI — `PASS`, 13 testes;
- parser stdlib do workflow Startup Actions — `PASS`;
- secret/PII guard e regressões — `PASS`, guard canônico mais 5 testes;
- `git diff --check` — `PASS`.

O host não possui Docker CLI (`DOCKER_CLI=ABSENT`), portanto nenhum Compose, imagem, digest,
health/readiness ou primeiro/segundo startup foi executado. Pester, NuGet, Docker e dependências
globais não foram instalados; nenhum deploy/reset/provider externo foi chamado.
