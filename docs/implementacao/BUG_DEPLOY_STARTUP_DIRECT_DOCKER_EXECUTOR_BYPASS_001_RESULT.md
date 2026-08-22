# BUG-DEPLOY-STARTUP-DIRECT-DOCKER-EXECUTOR-BYPASS-001 — resultado

- **Status:** `IMPLEMENTED_STRUCTURAL_GREEN_RUNTIME_PENDING`
- **Classificação:** `PRODUCT_REGRESSION`
- **Baseline:** `70c49483359b654612631fff68838395984ce3e1`

## Causa e correção

`LOCK-STARTUP-001` exige que todo comando Docker do startup use o executor nativo central, com exit
code como autoridade. O deploy on-premise mantinha uma função própria baseada em `& docker` e
`$LASTEXITCODE`; o BAT sequencial também executava `docker compose ps/logs` diretamente após falha.

O deploy agora importa `contabilidade-docker.psm1` e usa `Invoke-ContabilidadeDocker`,
`Test-ContabilidadeDockerImage` e a classificação canônica de falhas para daemon, Compose, pull,
imagem e validação de configuração. As chamadas diagnósticas redundantes foram removidas do BAT: o
PowerShell sequencial já coleta logs focados e preserva a causa/exit code antes de devolver a falha.

O guard estrutural rejeita qualquer retorno de Docker direto nesses dois owners, e o workflow
Startup Actions passa a observar também o BAT sequencial.

## Owners e locks

- `scripts/deploy-contabilidade-onpremise.ps1`;
- `scripts/start-compose-sequential.bat`;
- `scripts/codex/validate-docker-orchestration.mjs`;
- `.github/workflows/startup-actions.yml`;
- este `RESULT_MD`;
- `LOCK-STARTUP-001`, `LOCK-ENV-001`, `LOCK-TEST-001`, `LOCK-EVID-001` e `LOCK-GIT-001`
  preservados.

## Evidência e limitação

- `node --test scripts/codex/validate-docker-orchestration.test.mjs`: **10/10 PASS**;
- `node scripts/codex/validate-docker-orchestration.mjs`: **PASS**;
- `node --test scripts/codex/validate-startup-actions.test.mjs`: **9/9 PASS**;
- `node scripts/codex/validate-startup-actions.mjs`: **PASS**;
- parser Windows PowerShell 5.1 de `scripts/deploy-contabilidade-onpremise.ps1`: **PASS**;
- `python scripts/ci/test_validate_required_ci.py`: **13/13 PASS**;
- `python scripts/ci/validate_required_ci.py`: **PASS**;
- `python -m unittest scripts.security.test_secret_pii_guard`: **5/5 PASS**;
- `python scripts/security/secret_pii_guard.py`: **PASS**.

`DOCKER_CLI=ABSENT` neste host, então nenhum Compose, pull, imagem, log runtime,
health/readiness ou primeiro/segundo startup foi executado. Nenhum Docker, Pester, NuGet ou
dependência global foi instalado; não houve deploy, reset, remoção ou provider externo. Os gates
provam estrutura e regressão, não saúde runtime.
