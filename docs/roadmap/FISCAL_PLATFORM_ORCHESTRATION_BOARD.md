# Fiscal Operations Platform Orchestration Board

**Documentation classification:** `CANONICAL_ACTIVE`  
**Board version:** 0.1

## Current baseline

- Integration branch: `release/1.0.0`.
- Repository baseline: `ENV-001 OPEN`.
- Active phase: repository analysis and orchestration bootstrap.
- Official implementation wave: not yet authorized.
- Tests: separate task type only.

## Selection rules

- Exactly five official slots per implementation wave.
- Every slot starts from the same latest integrated baseline.
- Same-wave dependencies are prohibited.
- Critical-file ownership must not overlap.
- Migrations use exclusive names/ranges assigned in the wave plan.
- Shared app-shell, root-build, permission-inventory and canonical-registry updates are owned by one
  slot or serialized reconciliation, never multiple slots.
- Extras address one urgent defect/environment blocker and do not count in the five slots.
- No automatic successor selection.

## Current selection

| Item | Disposition |
|---|---|
| `PROMPT_00` | `SELECTED_NOW / DOCUMENTATION_BOOTSTRAP` |
| `STORY-FND-001` | `CANDIDATE_SERIAL_GATE / REPOSITORY_ANALYSIS_REQUIRED` |
| First five-slot wave | `BLOCKED_BY_SERIAL_GATE_AND_OVERLAP_ANALYSIS` |

## Shared reconciliation ownership

Only reconciliation may update multiple canonical authorities after merged slots: Registry, Product
Backlog portfolio summary, Orchestration Board, Delivery History and historical index/move manifest.

## Test policy

No implementation, bug-fix or reconciliation slot creates or runs tests. Pending proof is recorded
using standard tags. Dedicated test waves may use exactly three test tasks when explicitly requested.
