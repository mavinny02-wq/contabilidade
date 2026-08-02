TASK: {{TITLE}}
TYPE: {{TASK_TYPE}}
ITEM: {{ITEM_ID}}
BASELINE: latest release/1.0.0
EXECUTION MODE: CLOUD_FIRST
SLOT: {{SLOT_NUMBER}} OF 5

Work only in the repository supplied by Codex Cloud.

## Mandatory orientation

- Locate/read every applicable `AGENTS.md`.
- Read `docs/DOCUMENTATION_GOVERNANCE.md`.
- Read the Registry and applicable domain backlog.
- Inspect current owned files before editing.
- Do not use another slot from this wave as input.

## Objective

{{OBJECTIVE}}

## Owned paths

{{OWNED_PATHS}}

## Explicitly excluded paths

{{EXCLUDED_PATHS}}

## Contract

{{CONTRACT}}

## Exclusions

- Do not implement another stable item.
- Do not edit another slot's files.
- Do not edit shared reconciliation authorities unless assigned.
- Do not create, modify or execute tests.
- Do not run Maven test/Failsafe, Vitest, Playwright, coverage or mutation.
- Do not add dependencies without explicit license approval.
- Do not auto-select a successor.

## Allowed non-test validation

{{ALLOWED_VALIDATION}}

At minimum, run `git diff --check`.

## Documentation

Update at most:

- `{{DOMAIN_BACKLOG}}`;
- `{{EVIDENCE_DOCUMENT}}`.

Record pending proof with standard tags.

## Output

Return only files read, result, preserved behavior, security boundary, non-test validation,
pending-proof tags, backlog/evidence update, changed files and final Git state.
