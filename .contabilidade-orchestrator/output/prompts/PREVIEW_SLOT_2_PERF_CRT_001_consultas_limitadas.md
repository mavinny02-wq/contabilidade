# ARQUIVADO — PERF-CRT-001

> Não executar novamente. Implementação integrada pela PR `#15`.

- **ITEM:** `PERF-CRT-001`
- **STATUS:** `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
- **BASELINE DA IMPLEMENTAÇÃO:** merge da PR `#14`
- **BRANCH:** `feat/perf-crt-001-bounded-scheduler`
- **PR:** `#15`
- **MERGE:** `1b0827c887ad3637fa061521f43bcb15658d99ea`
- **EVIDÊNCIA:** `docs/implementacao/PERF_CRT_001_CONSULTAS_LIMITADAS.md`

## Resultado implementado

- queries bounded de IDs;
- lotes configuráveis para inicialização, agendamento e alertas;
- cursores rotativos com wrap;
- transação por item;
- preservação da idempotência diária;
- configurações esperadamente indisponíveis não bloqueiam o restante do lote.

## Estado de validação

Permanecem pendentes Maven e prova runtime com quantidade de registros superior aos limites,
avanço/wrap dos cursores, memória/tempo e ausência de duplicação.
