TASK: Extract the clean compile-ready Fiscal Operations Platform technical baseline
TYPE: IMPLEMENTATION
ITEM: STORY-FND-001
BASELINE: latest release/1.0.0
EXECUTION MODE: CLOUD_FIRST
GATE: BOOTSTRAP_SERIAL_GATE

This is a draft. Reconcile it against
`docs/analysis/FISCAL_PLATFORM_EUCO_REUSE_AND_BOOTSTRAP_ANALYSIS.md` before selection.

## Objective

Create the smallest clean product baseline preserving only approved generic infrastructure and
removing/isolating rail-domain behavior without introducing fiscal features.

## Rules

- Follow the repository-backed `REUSE / ADAPT / REMOVE / BUILD_NEW` matrix.
- Keep the repository compile-ready.
- Use Flyway only.
- Preserve generic authorization, error/correlation, i18n, audit, notifications, document abstraction
  and optional-search fail-soft behavior only where proven reusable.
- Remove visible rail navigation/routes and hidden coupling only within approved owned paths.
- Do not create fiscal business entities.
- Do not create, modify or run tests.
- Do not change dependency versions unless separately approved.
- Do not auto-select a successor.

## Allowed validation

Backend compilation, frontend production build, locale/configuration validation and
`git diff --check`.

Keep all test/runtime/coverage proof tags open for a later explicitly requested test wave.
