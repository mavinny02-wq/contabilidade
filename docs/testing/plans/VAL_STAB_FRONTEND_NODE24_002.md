# VAL-STAB-FRONTEND-NODE24-002 — frontend no runtime Node suportado

**Status:** `PREPARED_NOT_RELEASED`

## Objetivo

Remover a única ressalva ambiental de `VAL-STAB-FRONTEND-001` executando no Node oficialmente
suportado.

## Ambiente

- Node.js 24.x ou, no mínimo, `>=22.12.0`;
- npm `>=10`;
- instalação somente pelo lockfile.

## Execução

```text
cd frontend
npm ci --no-audit --no-fund
npm run locale:validate
npm run typecheck
npm test
npm run build
```

## Proibições

- frontend somente leitura;
- não atualizar lockfile/dependências;
- não aceitar `EBADENGINE`;
- não chamar backend/provider externo.

## Aceite

Todos os comandos com exit zero, 20 ou mais testes verdes, build produzido sem erro de engine e
resultado em `docs/testing/runs/VAL_STAB_FRONTEND_NODE24_002.md`.
