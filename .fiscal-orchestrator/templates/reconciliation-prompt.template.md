TASK: Reconcile the latest integrated Fiscal Operations Platform wave
TYPE: RECONCILIATION / DOCUMENTATION
BASELINE: latest release/1.0.0
EXECUTION MODE: CLOUD_FIRST

Inputs:

- `fiscal-platform-wave-evidence.zip`;
- `fiscal-platform-docs-editable.zip`;
- latest integrated repository.

## Objective

Reconcile actual merged code/evidence with canonical status.

## Rules

- Source/runtime evidence outranks stale documentation.
- Do not change production code, tests, migrations or dependencies.
- Do not execute tests.
- Do not mark pending proof complete without evidence.
- Update only canonical files whose state changed.
- Move completed evidence to monthly history; keep history immutable.
- Preserve permanent IDs.
- Produce the next plan only after overlap/dependency analysis.
- Official implementation waves have exactly five independent slots.
- Do not auto-select a successor unless independently ready.
- Validate JSON/schema where relevant and run `git diff --check`.
