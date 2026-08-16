# Prompts legados

**Classificação:** `LEGACY_NOT_EXECUTABLE`

Todos os arquivos `PREVIEW_SLOT_*` e o gate antigo nesta pasta são evidência histórica. Não devem
ser copiados, enviados ao Codex ou tratados como onda preparada/liberada.

A autoridade atual é:

```text
docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md
docs/orquestracao/CONTABILIDADE_WAVE_ORCHESTRATION_V2.md
docs/orquestracao/waves/released/
```

Uma nova task só é executável quando existir em uma onda `RELEASED_FOR_EXECUTION`, tiver baseline,
owner, locks, migration e `RESULT_MD` exatos e passar o validator.

O histórico funcional permanece nos commits, PRs, `docs/implementacao/`,
`docs/roadmap/HISTORICO_ENTREGAS.md` e ledger de testes.
