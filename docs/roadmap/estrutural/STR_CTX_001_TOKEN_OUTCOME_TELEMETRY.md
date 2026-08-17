# STR-CTX-001 — telemetria de tokens por outcome

## Dispatch

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_FAST_LANE_WAVE_007 --item STR-CTX-001 --baseline d4c5391ebcf44b9fc7d3a7db7a488a5e7564889b \
  --key 1e0c682805c8f0407d0594c5a51ef5698726c40b944deee5222f8260f2b97bc2 --github-aware --register
```

## Objetivo

Transformar o profiler atual em telemetria mensurável de consumo por task/wave/outcome, sem rede e
sem armazenar prompt, resposta ou chain-of-thought.

## Contrato de evento

Campos mínimos:

- `waveId`, `item`, `dispatchKey`;
- modelo e executor;
- `inputTokens`, `outputTokens`, `cachedTokens`, `reasoningTokens` quando reportados;
- origem `PROVIDER_REPORTED` ou `LOCAL_ESTIMATE`;
- categoria HOT/WARM/COLD;
- outcome e classificação;
- custo opcional com moeda e tabela identificada;
- timestamp e fingerprint idempotente.

## Aceite

- reported e estimated nunca são somados como se fossem equivalentes;
- duplicata é rejeitada por fingerprint;
- agregação por task, wave, modelo, categoria e outcome;
- custo por `PASS`, rerun, blocker e outcome útil;
- top consumidores e contexto duplicado visíveis;
- budget breach com código estável;
- campos de prompt/log/secret são rejeitados ou redigidos antes de persistir;
- saída JSON determinística e resumo Markdown;
- fixtures cobrem cache, reasoning, moeda ausente, custo desconhecido, duplicata e redaction;
- nenhuma chamada a OpenAI ou outro provider.

Não inventar tokens reais quando somente estimativa estiver disponível.
