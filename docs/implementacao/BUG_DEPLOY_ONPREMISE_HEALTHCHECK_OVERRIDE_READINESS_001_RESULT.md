# BUG-DEPLOY-ONPREMISE-HEALTHCHECK-OVERRIDE-READINESS-001 — resultado

- **Status:** `IMPLEMENTED_STRUCTURAL_GREEN_RUNTIME_PENDING`
- **Classificação:** `PRODUCT_REGRESSION`
- **Baseline:** `5001139a6e2a57b0d4152ac9bf2c4bcaf41f413c`

## Causa e correção

O Compose base define o healthcheck do backend pelo endpoint Spring Boot
`/actuator/health/readiness`. O override gerado pelo deploy on-premise substituía esse teste por
`test -f /app/app.jar`. Como o JAR já existe na imagem, o container podia ser classificado como
`healthy` sem provar que a aplicação, o banco e as migrations estavam prontos.

O override on-premise agora altera somente `image` e `build: null`, preservando o healthcheck de
readiness do Compose base. O guard de ações de startup compara os dois owners e falha se um override
voltar a substituir readiness por presença de artefato ou se a imagem publicada deixar de fornecer
o cliente HTTP usado pelo teste. O workflow Windows passa a observar o deploy, o Compose base e o
Dockerfile do backend e inclui o script de deploy no parse PowerShell 5.1.

Durante a validação, o guard revelou `TEST_CONTRACT_DRIFT`: ele esperava que a seção `run_start`
chamasse o script de preflight diretamente, enquanto o BAT canônico o delega para a subrotina
`:runtime_preflight`. O guard agora exige a chamada da subrotina e prova separadamente que ela invoca
o preflight autoritativo; uma regressão negativa impede uma subrotina vazia.

## Target operacional persistido

`docs/arquitetura/ARQUITETURA_BASE.md` agora declara Docker/Compose como target de deploy próximo ao
padrão operacional do PRIMA: fases separadas, imagens prontas, executor Docker central, ordem de
dependências, health/readiness, contexto preservado, zero prune/remoção de dados no caminho normal,
evidência pinada e reset futuro explícito/escopado com preservação de dados por padrão.

## Owners e locks

- `scripts/deploy-contabilidade-onpremise.ps1`;
- `scripts/codex/validate-startup-actions.mjs`;
- `scripts/codex/validate-startup-actions.test.mjs`;
- `.github/workflows/startup-actions.yml`;
- `docs/arquitetura/ARQUITETURA_BASE.md`;
- este `RESULT_MD`;
- `LOCK-STARTUP-001`, `LOCK-ENV-001`, `LOCK-TEST-001`, `LOCK-EVID-001` e `LOCK-GIT-001`
  preservados.

## Evidência e limitações

- `node --test scripts/codex/validate-startup-actions.test.mjs` — `PASS`, 9 testes;
- `node scripts/codex/validate-startup-actions.mjs` — `PASS`, seis contratos, incluindo preservação
  da readiness no deploy;
- parser Windows PowerShell 5.1 de `scripts/deploy-contabilidade-onpremise.ps1` — `PASS`;
- testes do contrato Required CI — `PASS`, 13 testes;
- parser stdlib do workflow `.github/workflows/startup-actions.yml` — `PASS`;
- `node --test scripts/codex/validate-docker-orchestration.test.mjs` — `PASS`, 9 testes;
- `node scripts/codex/validate-docker-orchestration.mjs` — `PASS`;
- secret/PII guard e regressões — `PASS`, guard canônico mais 5 testes;
- `git diff --check` — `PASS`.

Nenhum Docker, Compose, Pester, provider fiscal ou serviço externo foi executado. Portanto readiness
HTTP, primeiro/segundo startup, persistência e reset continuam pendentes no gate Windows/Docker
Desktop.

A correção deste item cobre o deploy com a imagem publicada governada por `backend/Dockerfile`. O
caminho artifact-only local continua usando a probe sequencial para readiness porque sua imagem
offline não contém `curl`; seu status Docker ainda usa presença do JAR e não é reivindicado como
readiness.

A auditoria read-only encontrou três successors source-proven que permanecem separados para manter
este item bounded:

1. os overrides artifact-only locais ainda publicam health por presença do JAR, embora o startup
   também execute a probe real;
2. deploy e diagnóstico BAT ainda possuem invocações Docker diretas fora do executor central;
3. o BAT sequencial verifica tags locais derivadas de `VERSION`, mesmo quando o deploy seleciona
   imagens de registry por digest.

O blocker externo do gate continua sendo a disponibilidade autorizada de NuGet/Pester 5+ e Docker
Desktop; nenhum software foi instalado nesta task.
