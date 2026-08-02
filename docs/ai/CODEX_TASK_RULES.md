# Codex task rules

**Classification:** `CANONICAL_ACTIVE`

## Mandatory header

Every prompt declares `TASK`, `TYPE`, `BASELINE`, `EXECUTION MODE`, stable backlog ID, explicit scope
and explicit exclusions.

## Orientation

- Read every applicable `AGENTS.md`.
- Read canonical authorities and the applicable domain backlog.
- Inspect current source/configuration before editing.
- Do not rely on old analysis unless linked from active documentation.

## Bounded work

- One independent purpose per prompt.
- Do not widen scope because adjacent code looks incomplete.
- Do not implement a successor.
- Do not create parallel routes, permission systems, migration frameworks or sources of truth.
- No broad rename/refactor without explicit authorization.

## Test exclusion

Unless `TYPE` is explicitly a test task/wave:

- do not create or modify tests;
- do not execute Maven test/Failsafe;
- do not execute Vitest/Playwright;
- do not execute coverage/mutation;
- do not block implementation completion only because tests remain pending.

## Allowed non-test validation

- backend compilation;
- frontend production build;
- locale/configuration validation;
- JSON/schema validation;
- `git diff --check`;
- focused static checks that are not tests.

## Documentation

A bounded implementation normally updates at most one domain backlog and one short evidence document.
Registry/portfolio/board/history reconciliation is serialized.

## Output

Return files read, result, preserved behavior, security boundary, non-test validation, pending-proof
tags, backlog/evidence update, changed files and final Git state.
