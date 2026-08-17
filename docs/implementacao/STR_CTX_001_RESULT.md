# STR-CTX-001 — resultado

**ITEM:** `STR-CTX-001`  
**WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_007`  
**DISPATCH_KEY:** `1e0c682805c8f0407d0594c5a51ef5698726c40b944deee5222f8260f2b97bc2`  
**Baseline:** `9d5561e545e502c78be88ec06a5e4291ccc449f9`  
**Status:** `PASS`  
**Migration:** `NONE`

## Owners alterados

- schema JSON do evento de telemetria;
- parser e agregador determinísticos em Python standard library;
- fixtures e testes focados;
- este `RESULT_MD`.

## Contrato implementado

- eventos identificam wave, item, dispatch, modelo, executor, origem, categoria, outcome,
  classificação, timestamp e fingerprint idempotente;
- uso reportado pelo provider e estimativa local permanecem em dimensões distintas;
- cache e reasoning são opcionais e nunca inferidos;
- fingerprint duplicado é rejeitado com código estável;
- agregação separa task, wave, modelo, categoria, outcome e origem, expondo top consumidores e
  fingerprints de contexto repetidos;
- budgets geram `TOKEN_BUDGET_BREACH` e custos são agrupados por outcome e moeda, mantendo custos
  sem moeda em uma contagem desconhecida separada;
- campos sensíveis conhecidos são removidos antes de persistência, ou rejeitados no modo estrito;
- CLI offline produz JSON determinístico e resumo Markdown, sem rede ou provider.

## Locks preservados

- `LOCK-DATA-001`: fixtures usam somente identificadores e valores sintéticos; prompt, resposta,
  chain-of-thought, segredo e credencial não são persistidos;
- `LOCK-EVID-001`: testes focados reutilizam a fixture canônica e exercitam somente os critérios
  liberados;
- `LOCK-WAVE-001`: alteração é limitada ao owner de telemetria e não cria owner ou slot adicional.

## Validação

- `python3 -m unittest scripts/orchestration/test_context_token_profiler.py -v` — `PASS`, 6 testes;
- `python3 scripts/orchestration/context_token_profiler.py scripts/orchestration/tests/fixtures/token-telemetry/events.valid.json --budget <arquivo-json> --json-output <arquivo-json> --markdown-output <arquivo-md>` — `PASS`;
- `python3 -m json.tool scripts/orchestration/schemas/token-telemetry-event.schema.json` — `PASS`;
- `git diff --check` — `PASS`.

## Limitações e provas pendentes

- Validação estrutural e testes unitários focados somente; não constitui prova de provider real.
- Custo só é totalizado quando a moeda está presente e não é convertido entre moedas.
- A heurística `LOCAL_ESTIMATE` deve ser fornecida explicitamente pelo produtor; o parser não
  inventa uso real.

## Commit / PR

- Commit: registrado no histórico Git desta branch.
- PR: criada após o commit por meio da ferramenta `make_pr`.
