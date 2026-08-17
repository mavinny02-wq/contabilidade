# VAL-W006-FULLSTACK-007 — smoke pós-hardening

## Dispatch

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_FAST_LANE_WAVE_007 \
  --item VAL-W006-FULLSTACK-007 \
  --baseline d4c5391ebcf44b9fc7d3a7db7a488a5e7564889b \
  --key e82ffab2bfaac2412a1d9d885845bdd6b4489ce14e86e9e0630418ae7cf36563 \
  --github-aware --register
```

## Objetivo

Revalidar somente o delta transversal da Wave 006: lazy routes, observabilidade HTTP e propagação
worker-backend. Produto é read-only.

## Ambiente

- Node 24;
- Java 21;
- PostgreSQL sintético/dedicado;
- Chromium local;
- rede bloqueada exceto localhost;
- nenhuma credencial, dado ou provider real.

## Provas

- build backend, frontend e worker;
- Flyway V1–V12 e JPA validate;
- liveness/readiness backend;
- health worker e frontend;
- proxy frontend → backend;
- heartbeat persistido;
- todas as jornadas do smoke existente, nunca menos que as 19 históricas;
- lazy route carregando e erro controlado de chunk;
- `X-Correlation-Id` devolvido e propagado;
- zero chamada externa;
- zero HTTP 5xx.

## Disposição

Falha deve ser classificada. Não alterar produto nem teste para forçar verde nesta task. Registrar
primeira causa, comando, exit code e successor exato.

## Owner

Somente `docs/testing/runs/VAL_W006_FULLSTACK_007.md`.
