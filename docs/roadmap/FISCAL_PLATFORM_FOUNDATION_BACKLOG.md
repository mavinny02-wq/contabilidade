# Fiscal Operations Platform Foundation Backlog

**Classification:** `CANONICAL_ACTIVE`

## EPIC-FND-001 — Extract a clean reusable foundation

### STORY-FND-001 — Clean technical baseline

- Status: `BOOTSTRAP_SERIAL_GATE_CANDIDATE`.
- Scope: repository-backed extraction after reuse analysis.
- Preserve only proven generic authentication, authorization, database/Flyway, shell, i18n, audit,
  notifications, document abstraction, errors/correlation, optional-search fail-soft architecture and
  observability.
- Remove/adapt rail modules, routes, permissions, migrations, translations, fixtures and references.
- Exclusions: fiscal features, connector implementations, business rules and tests.
- Allowed validation: backend compilation, frontend build, locale/config validation and
  `git diff --check`.
- Pending proof: `BACKEND_UNIT_TEST_PENDING`, `FRONTEND_FOCUSED_RETEST_REQUIRED`,
  `AUTHENTICATED_RUNTIME_RETEST_REQUIRED`, `E2E_PENDING_GENERAL_TEST`,
  `COVERAGE_REGENERATION_PENDING`.

### STORY-FND-002 — Product identity and shell

- Status: `PLANNED`.
- Requires `DEC-FND-001` and integrated `STORY-FND-001`.
