# VAL-STAB-WORKER-NODE24-PW-002 — worker com Node suportado e Chromium

**Status:** `PREPARED_NOT_RELEASED`

## Objetivo

Fechar as ressalvas de `VAL-STAB-WORKER-001` sem alterar o worker.

## Ambiente

- Node.js 24.x ou, no mínimo, `>=22.12.0`;
- npm `>=10`;
- Playwright `1.60.0` com Chromium correspondente instalado;
- rede externa bloqueada para o smoke.

## Execução

```text
cd automation-worker
npm ci --no-audit --no-fund
npx playwright install --with-deps chromium
npm run typecheck
npm test
npm run build
```

## Proibições

- worker somente leitura;
- não atualizar lockfile/dependências;
- não usar credenciais, dados reais ou portais fiscais;
- não contornar CAPTCHA/anti-bot;
- não aceitar `EBADENGINE`.

## Aceite

Sete testes ou a quantidade vigente integralmente verdes, browser smoke local-only aprovado, build
verde e resultado em `docs/testing/runs/VAL_STAB_WORKER_NODE24_PW_002.md`.
