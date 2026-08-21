# Contabilidade worker evaluation scorecard

**Classification:** `REPRODUCIBLE_WORKER_EVAL_EVIDENCE`
**Dataset:** `scripts/ai/worker_eval_samples.v1.json`

## Current aggregate

| Metric | Value |
|---|---:|
| Accepted corrections | 2 |
| Provider-reported tokens | 25465 |
| Tokens / accepted correction | 12732.5 |
| Latency ms / accepted correction | 63500 |
| Cost / accepted correction | NOT_AVAILABLE (0/2 samples) |
| First-pass acceptance | 0/2 (0) |
| Review blockers | 3 |
| Claims without evidence | 0 |
| Files outside owner | 0 |
| Accepted corrections with regression PASS | 2/2 |
| Accepted corrections with structural build PASS | 2/2 |
| Unsafe recommendations rejected in primary review | 1 |

## Samples

| ID | Model | Tokens | Latency ms | First pass | Blockers | Unsupported claims | Outside owner | Tests | Build | Unsafe rejected |
|---|---|---:|---:|---|---:|---:|---:|---|---|---|
| `optional-worker-routing-review-001` | `deepseek-v4-flash` | 12209 | 60000 | no | 2 | 0 | 0 | PASS | PASS | no |
| `synthetic-cpf-fixture-review-001` | `deepseek-v4-flash` | 13256 | 67000 | no | 1 | 0 | 0 | PASS | PASS | yes |

## Metric definitions

- `first-pass acceptance`: the primary reviewer accepted the worker recommendation without a required correction.
- `review blockers`: actionable blockers confirmed by the primary reviewer, including a risk-bearing recommendation that was rejected.
- `claims without evidence`: assertions the primary review could not support from the bounded source or gate output.
- `files outside owner`: files inspected or changed outside the launcher boundary.
- test/build PASS values come from the linked RESULT_MD, never from the worker's own claim.

## Interpretation boundaries

- The token counts are provider-reported totals copied from the two worker footers; prompts and responses are not persisted.
- Cost is `NOT_AVAILABLE`, not zero: neither sample returned a billed amount and no versioned price table was applied.
- There is no equivalent OpenAI sample, so this scorecard makes no provider cost or quality comparison.
- A correction is accepted only after primary review and green recorded gates; worker output never self-accepts.

## Adding a sample

1. Add one object to `scripts/ai/worker_eval_samples.v1.json`; never store prompt, response, source text, secret or PII.
2. Use `PROVIDER_REPORTED` only for a provider/footer counter; otherwise mark the sample `LOCAL_ESTIMATE`.
3. Record cost only with a billed amount or versioned price-table `sourceId`; unknown cost remains `null`.
4. Record first-pass acceptance, review blockers, unsupported claims, owner drift and gate results from the primary RESULT_MD.
5. Regenerate this file with the command below and commit dataset, scorecard and RESULT_MD together.

```text
python scripts/ai/worker_eval_scorecard.py scripts/ai/worker_eval_samples.v1.json --markdown-output docs/ai/CONTABILIDADE_WORKER_EVAL_SCORECARD.md
```

`CONTABILIDADE_WORKER_EVAL_SCORECARD_V1`
