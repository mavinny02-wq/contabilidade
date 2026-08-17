# STR-CTX-002 — resultado

- **ITEM:** `STR-CTX-002`
- **WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_008`
- **DISPATCH_KEY:** `8acd65e9ceb5d163e2011cc1968db320fed6a2c288a5f72bebe42e4c944fe802`
- **BASELINE:** `c5f414061161eaf0e131cf8ceea64cf73f95e32c` (latest `main` disponível no checkout)
- **STATUS:** `SUCCESS`
- **OWNER ALTERADO:** schema, catálogo/policy, parser/agregador, fixtures e testes de task budgets sob `scripts/orchestration/**`; este resultado exato.
- **LOCKS PRESERVADOS:** `LOCK-DATA-001`, `LOCK-EVID-001`, `LOCK-WAVE-001`.
- **COMPATIBILIDADE:** eventos 2.0 sem `taskClass` são explicitamente incompatíveis e falham com `TOKEN_REQUIRED_FIELD`; não existe inferência ou fallback oculto.
- **SEGURANÇA:** `PROVIDER_REPORTED` e `LOCAL_ESTIMATE` continuam separados; prompt, resposta, chain-of-thought, segredo e PII não são persistidos.
- **LIMITAÇÕES:** compile, parser e testes standard-library não provam runtime de provider; nenhuma chamada de provider foi realizada.
- **PROVAS PENDENTES:** nenhuma dentro da validação estrutural liberada.
- **COMMIT/PR:** commit criado na branch atual; PR preparado via `make_pr` após o commit.

## Validação

- `python3 -m unittest scripts.orchestration.test_context_token_profiler` — PASS (schema/parser, limite exato, warning, breach, policy/currency ausente, duplicata, redaction, origens e determinismo).
- `python3 -m json.tool scripts/orchestration/schemas/token-telemetry-event.schema.json` — PASS.
- `python3 -m json.tool scripts/orchestration/schemas/task-budget-policy.schema.json` — PASS.
- `python3 -m json.tool scripts/orchestration/task-budget-policy.v1.json` — PASS.
- duas execuções da CLI e `cmp` dos JSON/Markdown — PASS, byte-idênticas.
- `git diff --check` — PASS.
