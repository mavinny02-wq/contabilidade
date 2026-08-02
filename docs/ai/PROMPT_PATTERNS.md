# Prompt patterns

## Implementation

Use `.fiscal-orchestrator/templates/slot-prompt.template.md`: one stable item, one baseline, exclusive
file ownership, explicit domain behavior, no tests, proportionate build/compile validation, at most
one backlog and one evidence document, no successor.

## Analysis

Use `.fiscal-orchestrator/templates/analysis-prompt.template.md`. Analysis changes no production code
and registers stable findings only when evidence supports them.

## Decision

Use `.fiscal-orchestrator/templates/decision-prompt.template.md`. Approval does not automatically
authorize implementation unless explicitly stated.

## Test

Use `.fiscal-orchestrator/templates/test-prompt.template.md`. Test tasks exist only when explicitly
requested and do not silently implement product changes.

## Reconciliation

Use `.fiscal-orchestrator/templates/reconciliation-prompt.template.md`. Reconciliation compares
actual merged code/evidence to canonical status, archives completed evidence and plans the next safe
baseline without implementing it.
