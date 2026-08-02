# Fiscal Operations Platform documentation governance

**Documentation classification:** `CANONICAL_ACTIVE`  
**Effective date:** 2026-08-02

## Goal

Keep the active documentation set small, stable and authoritative. Completed analyses,
implementations, validations and reconciliations become immutable historical evidence.

## Active documentation

1. `docs/roadmap/` — registry, portfolio, orchestration, delivery history and domain backlogs;
2. `docs/decisions/` — unresolved or governing decisions;
3. `docs/requirements/` — approved product vision and source requirements;
4. current architecture, domain, security, operations, integrations and development standards;
5. non-dated AI workflow and orchestration standards.

## Historical documentation

Completed artifacts move to:

- `docs/historical/YYYY-MM/analysis/`;
- `docs/historical/YYYY-MM/implementation/`;
- `docs/historical/YYYY-MM/validation/`;
- `docs/historical/YYYY-MM/reconciliation/`.

Historical artifacts are immutable and indexed through `docs/historical/INDEX.md`.

## Authority order

1. Roadmap Item Registry;
2. applicable active domain backlog;
3. active decision document;
4. Orchestration Board;
5. Delivery History;
6. immutable historical evidence.

Production code and executable runtime configuration are higher-authority evidence for actual
implementation behavior.

## Update rule

A bounded slice updates only its owned production/configuration files, at most one domain backlog
and at most one short evidence document. Shared reconciliation is serialized. Do not create duplicate
active reports for the same baseline and scope.

## Stable identity

IDs are permanent. Never reuse, renumber or silently change an ID's meaning. New IDs are appended to
the applicable domain sequence and registered in the Roadmap Item Registry.

## Benchmark evidence

Benchmark products are capability references only. Public marketing is not proof of an internal
implementation, rule, integration or algorithm. Authorized trial observations must record date,
context and uncertainty.
