# BUG-INFRA-001 — falso positivo no contrato de deploy sem build

**Classificação:** `CANONICAL_CORRECTION_SHARD`
**Status:** `PREPARED_NOT_RELEASED`

## Evidência

`VAL-STAB-INFRA-CONTRACT-001` reproduziu falha em
`scripts/codex/validate-docker-orchestration.mjs`. O detector tratou texto operacional contendo
`Docker build` como se fosse uma invocação executável, embora o deploy continue usando imagens
pré-construídas e `build: null`.

## Classificação

`TEST_CONTRACT_DRIFT`.

Não há evidência de que `scripts/deploy-contabilidade-onpremise.ps1` execute build. A produção não
deve ser alterada para satisfazer a asserção.

## Objetivo

Corrigir o guard para distinguir:

- invocação real de `docker build`/`docker buildx`;
- passagem de `build`/`buildx` ao wrapper `Invoke-Docker`;
- mensagens, comentários e documentação que apenas descrevem a proibição.

## Owner

- `scripts/codex/validate-docker-orchestration.mjs`;
- teste/fixture específico do guard;
- `docs/implementacao/BUG_INFRA_001_RESULT.md`.

Startup, deploy, Compose, aplicação, migrations e dependências ficam fora do owner.

## Aceite

- frase descritiva `sem executar Docker build` é permitida;
- uma linha executável `docker build ...` é rejeitada;
- `Invoke-Docker -Arguments @('build', ...)` e `buildx` são rejeitados;
- prune global, `compose down -v` e remoção destrutiva continuam rejeitados;
- guard e regressões passam em Node suportado;
- `git diff --check` verde.

## Gate

O arquivo do guard está no owner da PR `#56`. Liberar somente após integração ou encerramento dessa
PR e refresh do HEAD.
