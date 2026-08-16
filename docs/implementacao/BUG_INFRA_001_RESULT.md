# BUG-INFRA-001 — correção do falso positivo no contrato Docker

## Resultado

O guard de orquestração Docker agora diferencia uma invocação direta de `docker build` ou
`docker buildx build` de mensagens operacionais que apenas citam esses comandos. Assim, o deploy
on-premise continua proibido de executar builds, sem reprovar a mensagem que informa que nenhum
build será executado no servidor.

## Arquivos lidos

- `AGENTS.md`;
- `scripts/AGENTS.md` foi procurado, mas não existe no baseline disponível;
- `docs/roadmap/estrutural/BUG_INFRA_001_DOCKER_CONTRACT_FALSE_POSITIVE.md` foi procurado, mas não
  existe no baseline disponível;
- `docs/testing/runs/VAL_STAB_INFRA_CONTRACT_001.md`;
- `scripts/codex/validate-docker-orchestration.mjs`;
- `scripts/deploy-contabilidade-onpremise.ps1`.

## Alterações

- O detector de build foi isolado em uma função testável e passou a analisar cada linha a partir
  da posição de comando, incluindo o operador de chamada do PowerShell e `docker.exe`.
- Foram adicionadas regressões focadas para o caso negativo das mensagens descritivas e para os
  casos positivos de invocações reais de `docker build` e `docker buildx build`.
- Nenhum script de startup/deploy, Compose, workflow ou dependência foi alterado.

## Validações

- Guard: `node scripts/codex/validate-docker-orchestration.mjs`.
- Regressões positiva e negativa: `node --test scripts/codex/validate-docker-orchestration.test.mjs`.
- Integridade do diff: `git diff --check`.

## Pendências

Nenhuma pendência funcional identificada no escopo da task. O arquivo de roadmap solicitado e o
`scripts/AGENTS.md` não estavam presentes no baseline local.
