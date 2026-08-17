# STR-ARCH-002 — boundary do composition root do worker

## Dispatch

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_FAST_LANE_WAVE_008 --item STR-ARCH-002 --baseline 77141fae2f04a430bc2cb51264886c083977a3ce \
  --key e5228142ef38fb8cb8af54b6a64abdeb8c9ffb01878a0ad8289a4d4055e491ac --github-aware --register
```

## Owner

Pode alterar `automation-worker/src/index.ts`, uma nova camada
`automation-worker/src/composition/**`, testes focados, o inventário/baseline/allowlist de
arquitetura e `docs/implementacao/STR_ARCH_002_RESULT.md`. Implementações concretas dos fluxos,
contratos backend e providers são preservados.

## Objetivo

Remover as quatro arestas `worker.core_to_provider` do `index.ts` para Federal, SEFAZ-SP, PGE-SP e
Serpro, mantendo o mesmo registry, modos API/PORTAL, configuração, health e lifecycle.

## Aceite

- `index.ts` não importa classes concretas de provider;
- a composition layer instancia e registra os mesmos fluxos, sem service locator global;
- ordem, códigos, capacidades e habilitação dos providers permanecem equivalentes;
- testes com factories sintéticas comprovam composição e ausência de provider não registrado;
- o architecture guard reduz findings totais de 10 para 6 e
  `worker.core_to_provider` de 4 para 0;
- somente as quatro entradas eliminadas saem da allowlist; os seis findings backend permanecem
  intactos e com a mesma revisão;
- nenhum endpoint, payload, segredo, browser policy ou dependência nova é introduzido.

## Validação

Node 24; `npm ci`, typecheck, testes focados, build, inventory/check arquitetural duas vezes e
`git diff --check`. Provider real e rede externa permanecem proibidos.
