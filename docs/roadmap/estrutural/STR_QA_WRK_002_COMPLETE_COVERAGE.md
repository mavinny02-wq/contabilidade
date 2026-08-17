# STR-QA-WRK-002 — coverage completo do worker

## Dispatch

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_FAST_LANE_WAVE_007 --item STR-QA-WRK-002 --baseline d4c5391ebcf44b9fc7d3a7db7a488a5e7564889b \
  --key a0c5e2fe0ce3a26cefec64e0d92bf540e5dc2397f593de2752771b2d51a707c9 --github-aware --register
```

## Owner

Produção do worker é read-only. Pode alterar testes focados e somente a seção worker do baseline de
coverage quando a prova completa for verde.

## Prova obrigatória

- Node 24;
- Chromium correspondente ao Playwright pinado;
- rede externa bloqueada após provisionamento;
- `npm ci`, typecheck, suíte completa, build e `test:coverage`;
- inclui worker, reliability e observability tests;
- nenhum handle, browser, timer ou servidor pendente ao final.

## Promoção do baseline

Só promover `complete: true` quando:

- todos os testes passarem;
- relatório tiver numerador e denominador não vazios;
- duas medições consecutivas forem reproduzíveis;
- ratchet passar sem reduzir threshold ou tolerância;
- a seção backend/frontend permanecer byte-equivalente.

Falha de Chromium ou ambiente é `ENVIRONMENT_LIMITATION`; falha funcional é
`PRODUCT_REGRESSION`. Nenhuma chama provider, CAPTCHA ou portal externo.
