# AI-assisted delivery workflow

**Classification:** `CANONICAL_ACTIVE`

## Standard cycle

```text
Inspect latest integrated repository
        ↓
Reconcile requirements and evidence
        ↓
Select one bounded task
        ↓
Execute in Codex from latest release baseline
        ↓
User reviews and merges PR
        ↓
Export technical evidence and editable documentation ZIPs
        ↓
Serialize reconciliation
        ↓
Commit accepted documentation
        ↓
Plan the next safe wave
```

## Evidence hierarchy

1. authenticated runtime evidence;
2. dedicated test evidence from an explicitly requested test task;
3. native database/API evidence;
4. current production code/configuration;
5. current canonical documentation;
6. public documentation;
7. marketing claims/inference.

## Task separation

Separate prompts for analysis, decision, implementation, bug correction, test task/wave,
reconciliation and environment investigation.

## Wave rules

- Five official independent slots.
- Optional extras do not count.
- Same baseline and no same-wave dependency.
- Explicit non-overlapping file ownership.
- Shared reconciliation after merges.
- No automatic successor.

## Test rule

Implementation, bug correction, reconciliation and next-wave prompts do not request test creation or
execution. Missing proof stays visible through pending tags. Tests run only when explicitly requested.
