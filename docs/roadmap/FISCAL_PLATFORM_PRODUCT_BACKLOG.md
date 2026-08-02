# Fiscal Operations Platform product backlog

**Documentation classification:** `CANONICAL_ACTIVE`  
**Backlog version:** 0.1

## Portfolio sequence

1. `EPIC-FND-001` — clean technical foundation.
2. `EPIC-ORG-001` — companies and registrations.
3. `EPIC-OPS-001` — obligations, routines and tasks.
4. `EPIC-CMP-001` — certificates and compliance operation.
5. `EPIC-INT-001` — official and assisted connectors.
6. `EPIC-SRCH-001` — global search.
7. `EPIC-ADM-001` — permissions, audit and technical administration.
8. `EPIC-INTEL-001` — BI, score, diagnostics and grounded AI.

## Current checkpoint

`EPIC-FND-001` is the only active portfolio entry. Repository-backed reuse analysis and the possible
serial baseline gate must complete before the first official five-slot implementation wave.

## Non-regression contract

- Retained generic infrastructure stays compile-ready.
- Rail behavior is not product scope and must not survive as hidden visible behavior.
- Removal is dependency-aware and migration-aware.
- PostgreSQL remains authoritative when optional search is unavailable.
- Authorization remains backend-enforced.
- Unknown external state remains unknown.
- No competitor-specific content or identity enters the product.

## Pending-proof policy

Implementation waves do not request tests. Required proof remains tagged as applicable:

`BACKEND_UNIT_TEST_PENDING`, `NATIVE_POSTGRESQL_PENDING`, `FRONTEND_FOCUSED_RETEST_REQUIRED`,
`HTTP_RUNTIME_RETEST_REQUIRED`, `AUTHENTICATED_RUNTIME_RETEST_REQUIRED`,
`CONCURRENCY_RETEST_REQUIRED`, `PLAYWRIGHT_PENDING_GENERAL_TEST`,
`E2E_PENDING_GENERAL_TEST`, `COVERAGE_REGENERATION_PENDING`.
