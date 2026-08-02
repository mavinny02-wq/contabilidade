# Fiscal Operations Platform architecture baseline

**Classification:** `CANONICAL_ACTIVE`  
**Status:** `PROPOSED / REPOSITORY_RECONCILIATION_REQUIRED`

## Target shape

Start as a modular monolith with isolated integration workers where required.

```text
React
  |
Spring Boot modular application
  |
PostgreSQL + object storage + optional cache/search
  |
Connector execution queue/workers
  |
Official APIs, files and assisted/manual sources
```

## Initial modules

`identity`, `organization`, `company`, `taxregistration`, `obligation`, `certificate`,
`fiscalquery`, `externalmessage`, `payment`, `document`, `task`, `notification`, `integration`,
`compliance`, `reporting`, `search`, `audit`, `administration`.

## Permanent rules

- Flyway is the only schema migration mechanism.
- Backend services own business rules and command availability.
- Keycloak authenticates; the Permission Catalog authorizes.
- PostgreSQL is authoritative.
- Optional search indexing fails softly.
- Connector-specific payloads are isolated from normalized domain projections.
- Every external observation records source, request time, observed time, status, provenance,
  correlation, raw-evidence reference and normalization version.
- Integration failures do not become fiscal irregularity unless a deterministic rule explicitly
  classifies them.
- No new microservice without evidenced operational need and an approved decision.
