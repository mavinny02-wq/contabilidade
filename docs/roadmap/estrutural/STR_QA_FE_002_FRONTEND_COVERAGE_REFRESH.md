# STR-QA-FE-002 — refresh de coverage frontend pós-lazy/a11y

## Estado

`RELEASED_FOR_EXECUTION` pela `CONTABILIDADE_FAST_LANE_WAVE_009`.

## Problema

O baseline frontend foi medido antes das mudanças de lazy loading, shell, modal e smoke de
acessibilidade. O valor atual precisa ser medido novamente sem inventar média agregada nem reduzir
ratchet para obter verde.

## Owner

- testes frontend;
- configuração de coverage estritamente necessária;
- somente a seção `frontend` de `scripts/quality/coverage-baseline.json`;
- `docs/implementacao/STR_QA_FE_002_RESULT.md`.

Produção frontend, APIs, backend, worker e outras seções do baseline permanecem read-only.

## Prova

- Node 24;
- `npm ci`;
- locale, typecheck e suíte unitária completa;
- `npm run test:coverage` duas vezes consecutivas;
- numeradores e denominadores de lines, branches, functions e statements;
- resultados reproduzíveis;
- build Vite;
- smoke a11y existente verde;
- ratchet contra o baseline anterior;
- nenhuma redução de threshold/tolerância sem decisão explícita.

## Aceite

- `complete: true`;
- duas medições iguais dentro da tolerância canônica;
- nenhuma regressão silenciosa;
- somente a seção frontend atualizada;
- produção read-only;
- falha funcional gera successor separado.

`STR_QA_FE_002_RELEASED`
