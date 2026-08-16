# FIX-STARTUP-MAIN-001 — reaplicar e superseder a PR #56

**Classificação:** `CANONICAL_CORRECTION_SHARD`  
**Prioridade:** P0  
**Baseline inspecionada:** `main@91a42c8e96775f2cbe3c09481beed879d4fbab31`

## Problema

A PR `#56` contém a direção correta para o startup, porém parte de uma baseline antiga, está
conflitante e toca arquivos que receberam alterações posteriores:

- o guard Docker foi corrigido pela PR `#65`;
- o workflow recebeu o migration registry pela PR `#61`;
- evidências Cloud de backend/frontend/worker já foram integradas.

Mergear a branch antiga pode perder ou regredir esses contratos.

## Objetivo

Criar uma substituição limpa baseada na `latest main`, reaplicando somente o comportamento desejado
da PR `#56` e preservando integralmente tudo que já foi integrado depois dela.

## Contrato funcional

Modo `dev`:

- único ponto de entrada `START_CONTABILIDADE.bat`;
- sobe somente PostgreSQL, backend, automation-worker e frontend;
- não sobe Keycloak nem `postgres-bootstrap`;
- não executa `docker compose down`;
- reutiliza PostgreSQL saudável;
- recria somente serviços/artefatos necessários;
- espera readiness/health e remove a sonda temporária;
- mantém volumes, documentos e backups.

Modo `onpremise`:

- PostgreSQL, bootstrap, Keycloak, backend, worker e frontend;
- imagens pré-construídas;
- nenhum Maven, npm ou Docker build no servidor;
- timeout configurável e evidência acionável.

## Ownership

Owner exclusivo:

```text
.env.example
.github/workflows/build.yml
.gitignore
START_CONTABILIDADE.bat
INSTRUCOES_START_CONTABILIDADE.md
README.md
docs/operacao/BUILD_DOCKER_RESILIENTE_E_DEPLOY_PRODUCAO.md
scripts/codex/validate-docker-orchestration.mjs
scripts/codex/validate-docker-orchestration.test.mjs
scripts/maintenance/**
scripts/start-compose-sequential.*
scripts/start-contabilidade-core.bat
scripts/start-contabilidade-resilient.ps1
scripts/validate-database-state.bat
```

Preservar o migration-governance job e a correção `containsDockerBuildCommand` da main.

## Validação

- guard Docker e regressões;
- parser PowerShell;
- Compose `dev` e `onpremise` config quando Docker estiver disponível;
- backend Maven verify com PostgreSQL controlado ou reuse documentado;
- frontend Node 24: i18n, typecheck, testes e build;
- worker Node 24 + Chromium: typecheck, testes e build;
- `git diff --check`.

Não alegar prova Windows/Docker Desktop no Cloud.

## Resultado

`docs/implementacao/FIX_STARTUP_MAIN_001_RESULT.md`

Após abertura da PR sucessora, a PR `#56` deve ser encerrada como `SUPERSEDED`, sem merge.
