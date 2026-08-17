# STR-API-002 — contratos consumidores frontend/API

## Dispatch

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_FAST_LANE_WAVE_007 --item STR-API-002 --baseline d4c5391ebcf44b9fc7d3a7db7a488a5e7564889b \
  --key e6a099540075a3f9d8998575595ee6d7b61dbb5e6d7af9acc982ed58e1b05743 --github-aware --register
```

## Owner

Escrita somente em `scripts/contracts/**`, `contracts/openapi/**` para artefato consumer e no
`RESULT_MD`. Backend e frontend são read-only.

## Entrega

Criar inventário determinístico dos call sites HTTP do frontend e compará-lo com:

1. `frontend-usage.json`;
2. snapshot OpenAPI;
3. método/path/operationId;
4. parâmetros e request body obrigatórios;
5. status/resposta efetivamente consumidos.

## Aceite

- call site novo não mapeado falha;
- item do usage map sem call site falha como drift;
- operação inexistente ou método divergente falha;
- path param obrigatório ausente falha;
- response/status consumido ausente falha;
- inventário gerado duas vezes é byte-idêntico;
- fixtures cobrem adição compatível, remoção, rename, método e parâmetro;
- nenhum client é gerado e nenhum endpoint é alterado;
- nenhuma chamada de rede ou dado real.

Exceção exige owner, motivo, transição e expiração.
