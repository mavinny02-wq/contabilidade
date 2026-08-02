TASK: Bootstrap the canonical documentation and orchestration baseline for the Internal Fiscal Operations Platform
TYPE: REPOSITORY ANALYSIS / DOCUMENTATION / ORCHESTRATION BOOTSTRAP
BASELINE: latest release/1.0.0
EXECUTION MODE: CLOUD_FIRST
PRODUCT WORKING NAME: Fiscal Operations Platform
TECHNICAL IDENTIFIER: fiscal-platform

Work only in the repository supplied by Codex Cloud.

## Context

The repository is expected to be a new repository or worktree initially derived from the latest
EUCO Rail `release/1.0.0` baseline. EUCO Rail is the technical accelerator, not the new product domain.

The target product is an internal fiscal and accounting operations platform for one company,
implemented incrementally. Public products such as Veri and Contabilizei are capability benchmarks
only. Do not copy proprietary code, protected content, branding, screenshots, private behavior or
visual identity.

The target direction includes:

- organization, legal entity, company, establishment, CNPJ and tax-registration management;
- operational routines, obligations, occurrences, deadlines, assignments and evidence;
- fiscal certificates, fiscal queries, external messages, guides, payments and documents;
- connector framework for official APIs and manual/assisted sources;
- global search with PostgreSQL as source of truth and optional search indexing;
- notifications, audit, permissions, configuration and technical operations;
- later phases for compliance findings, internal score, diagnostics, BI and grounded AI assistance.

## Mandatory orientation

1. Locate and read every applicable `AGENTS.md`.
2. Read the complete repository structure before proposing reuse.
3. Read the supplied bootstrap package, especially:
   - `README_START_HERE.md`;
   - `docs/DOCUMENTATION_GOVERNANCE.md`;
   - `docs/ACTIVE_DOCUMENTATION_INDEX.md`;
   - `docs/ai/AI_WORKFLOW.md`;
   - `docs/ai/CODEX_TASK_RULES.md`;
   - `.fiscal-orchestrator/README.md`;
   - `.fiscal-orchestrator/config.json`;
   - every current roadmap and architecture file.
4. Inspect current backend, frontend, Flyway, Keycloak, Docker, search, documents, notifications,
   audit, permissions, i18n, error handling and observability implementation.
5. Treat source code and executable configuration as higher-authority evidence than inherited docs.

## Objective

Create a repository-backed bootstrap checkpoint that:

1. identifies what can be `REUSE`, `ADAPT`, `REMOVE` and `BUILD_NEW` from EUCO Rail;
2. establishes the canonical documentation hierarchy;
3. establishes the permanent roadmap item registry and domain backlogs;
4. establishes the five-slot wave protocol and optional urgent extras;
5. creates a machine-readable initial `wave-plan.json`;
6. produces the first safe post-bootstrap implementation plan without implementing it;
7. keeps unknowns explicit and creates decision items instead of inventing business rules.

## Required repository analysis

Create a precise `REUSE / ADAPT / REMOVE / BUILD_NEW` matrix covering at least:

- backend application foundation;
- frontend app shell and shared components;
- authentication and Keycloak;
- Permission Catalog and backend authorization;
- PostgreSQL and Flyway;
- optional Meilisearch integration;
- documents and object-storage abstraction;
- notifications;
- audit/history;
- errors and correlation IDs;
- i18n EN/DE/PT;
- Docker/local profiles;
- technical console and observability;
- all rail-specific modules, routes, migrations, permissions, translations and fixtures.

For every `REUSE` or `ADAPT` decision, identify concrete repository paths. For every `REMOVE`
decision, identify dependency and migration risks. Do not classify something as reusable merely
because its name appears generic.

## Canonical documentation contract

Reconcile and complete these files without creating parallel authorities:

- `docs/ACTIVE_DOCUMENTATION_INDEX.md`;
- `docs/DOCUMENTATION_GOVERNANCE.md`;
- `docs/roadmap/FISCAL_PLATFORM_ROADMAP_ITEM_REGISTRY.md`;
- `docs/roadmap/FISCAL_PLATFORM_PRODUCT_BACKLOG.md`;
- `docs/roadmap/FISCAL_PLATFORM_ORCHESTRATION_BOARD.md`;
- `docs/roadmap/FISCAL_PLATFORM_DELIVERY_HISTORY.md`;
- every active domain backlog already present in `docs/roadmap/`;
- `docs/architecture/FISCAL_PLATFORM_ARCHITECTURE_BASELINE.md`;
- `docs/domain/FISCAL_PLATFORM_DOMAIN_MODEL.md`;
- `docs/integrations/FISCAL_PLATFORM_INTEGRATION_CATALOG.md`;
- `docs/security/FISCAL_PLATFORM_SECURITY_BASELINE.md`;
- `docs/requirements/FISCAL_PLATFORM_PRODUCT_VISION.md`;
- `docs/requirements/FISCAL_PLATFORM_BENCHMARK_SCOPE.md`;
- `docs/ai/AI_WORKFLOW.md`;
- `docs/ai/CODEX_TASK_RULES.md`;
- `docs/ai/PROMPT_PATTERNS.md`;
- `docs/historical/INDEX.md`.

Create exactly one repository-backed analysis document:

- `docs/analysis/FISCAL_PLATFORM_EUCO_REUSE_AND_BOOTSTRAP_ANALYSIS.md`.

Do not create dated duplicates for the same baseline and scope.

## Stable identity rules

Use permanent IDs and append new IDs at the end of the applicable domain sequence.

Initial prefixes:

- `EPIC-FND`, `STORY-FND`, `DEBT-FND`, `BUG-FND`;
- `EPIC-ORG`, `STORY-ORG`, `DEBT-ORG`, `BUG-ORG`;
- `EPIC-OPS`, `STORY-OPS`, `DEBT-OPS`, `BUG-OPS`;
- `EPIC-CMP`, `STORY-CMP`, `DEBT-CMP`, `BUG-CMP`;
- `EPIC-INT`, `STORY-INT`, `DEBT-INT`, `BUG-INT`;
- `EPIC-SRCH`, `STORY-SRCH`, `DEBT-SRCH`, `BUG-SRCH`;
- `EPIC-ADM`, `STORY-ADM`, `DEBT-ADM`, `BUG-ADM`;
- `EPIC-INTEL`, `STORY-INTEL`, `DEBT-INTEL`, `BUG-INTEL`;
- `DEC-*` for unresolved decisions;
- `ENV-*` for environment blockers.

The Registry owns stable identity and current lifecycle status. Domain backlogs own detailed
contracts. The Orchestration Board owns selection and slot allocation. Delivery History records
integrated results only.

## Orchestration protocol

- Codex prompts are written in English.
- The integration branch is `release/1.0.0`.
- The user performs PR review and merge.
- Every official implementation wave has exactly five independent slots.
- Optional urgent extras do not count as official slots.
- Every slot starts from the same latest `release/1.0.0`.
- No slot may consume another slot from the same wave.
- File ownership must be explicit and non-overlapping.
- Shared reconciliation is serialized after intended merges.
- A dependency discovered inside a wave moves to the next wave.
- One task must not silently implement another backlog item.
- Analysis, implementation, bug correction, tests, decisions and reconciliation are separate types
  and separate prompts.
- Test work is never embedded in implementation, bug-fix, reconciliation or next-wave prompts.
- Tests are created and executed only in an explicitly requested test task or test wave.
- Unexecuted proof remains in backlogs with pending tags.
- Allowed non-test validation in implementation tasks is limited to proportionate compilation,
  build, locale/configuration validation and `git diff --check`.

## First post-bootstrap plan

Produce a safe first post-bootstrap plan.

Do not force five implementation slots when repository dependencies make them unsafe. Instead:

1. identify the required serial foundation step, when one exists;
2. mark it `BOOTSTRAP_SERIAL_GATE`;
3. define the first official five-slot wave that becomes safe only after that gate is integrated;
4. assign exclusive file and migration ownership;
5. identify shared files that only reconciliation may edit;
6. leave all test execution as pending tagged work.

The five planned slots must be independently executable from the same future baseline.
Do not generate implementation code in this task.

## Machine-readable orchestration

Create or update:

- `.fiscal-orchestrator/output/wave-plan.json`;
- `.fiscal-orchestrator/output/prompts/README.md`;
- one prompt file for the serial gate when required;
- five future slot prompt drafts only when their common safe baseline is clear.

Validate `wave-plan.json` structurally against
`.fiscal-orchestrator/schemas/wave-plan.schema.json`.
Do not call external AI APIs or create an autonomous merge process.

## Exclusions

Do not:

- change production code or runtime configuration;
- add or remove dependencies;
- add or modify Flyway migrations;
- rename Java packages;
- remove EUCO Rail modules yet;
- change user-facing routes or Keycloak realms;
- create mock/demo data;
- implement fiscal rules, integrations or search behavior;
- create, modify or run tests;
- run Maven test, Failsafe, Vitest, Playwright, coverage or mutation;
- infer proprietary behavior from public competitors;
- copy competitor branding, text, code, screenshots or visual identity;
- auto-select a successor after this bootstrap plan.

## Allowed validation

- validate JSON syntax and schema compatibility;
- validate links and required file presence;
- run `git diff --check`;
- report that production builds and tests were not required and were not executed.

## Output

Return only:

1. repository baseline and Git state;
2. files read;
3. repository-backed reuse matrix summary;
4. canonical authorities created or reconciled;
5. stable IDs registered;
6. serial bootstrap gate, if required;
7. first safe five-slot wave plan;
8. overlap and dependency analysis;
9. pending decisions and test tags;
10. exact validation executed;
11. changed files;
12. final Git state.
