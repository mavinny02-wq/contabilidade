# AGENTS.md

## Product

Fiscal Operations Platform is an internal fiscal and accounting operations platform for one company.
EUCO Rail is a technical accelerator only.

Internal code names must be English. Portuguese, English and German are allowed for visible i18n
labels, customer-facing documentation and examples.

## Architecture

- Backend: Java / Spring Boot.
- Database: PostgreSQL.
- Schema migration: Flyway only.
- Frontend: React with retained reusable app-shell components.
- Authentication: Keycloak / OAuth2 / JWT.
- Authorization: backend-enforced Permission Catalog.
- Search: PostgreSQL authoritative; optional indexing fails softly.
- Documents: object-storage abstraction; secrets and contents never leak to logs.
- Integrations: connector contracts isolate official APIs, files and assisted/manual sources.
- Backend owns business rules, derived states, deadlines, permissions, counters and command
  availability.
- Frontend renders display-ready contracts and must not reconstruct fiscal rules.

## Product boundaries

Do not copy proprietary code, branding, screenshots, private workflows or protected content from
benchmark products. Public products may inform capability discovery only.

No AI-generated conclusion becomes authoritative fiscal state. Deterministic rules and source
evidence remain authoritative; AI may explain grounded facts in later approved phases.

## Security

- Treat certificates, private keys, credentials, tax documents, messages and personal data as
  sensitive.
- Never log secrets, tokens, certificate passwords, raw private keys, full external payloads or
  unnecessary personal data.
- Enforce authorization before data resolution.
- Preserve audit/evidence for meaningful commands.
- Do not bypass CAPTCHA or anti-automation controls.
- Do not add a portal robot where an official API exists without an explicit decision.

## UI

- Visible text uses i18n keys with EN, DE and PT translations.
- Do not use browser `alert`, `prompt` or `confirm`.
- Do not display unavailable or unknown data as healthy, complete or zero.
- Preserve responsive layouts and accessibility.
- Avoid dense fixed-column screens and destructive drawer compression.

## Traceability

- Do not physically delete released or traceable fiscal records by default.
- Prefer archive, deactivate, supersede or status transitions.
- Preserve source, observed time, validity, provenance, actor, correlation and evidence.
- Current external data must not impersonate historical evidence.

## Orchestration

- Prompts are written in English.
- Official waves have exactly five independent slots.
- Every slot starts from the same latest `release/1.0.0`.
- Same-wave dependency or critical-file overlap is prohibited.
- Shared reconciliation is serialized.
- Test work is separate from implementation, bug-fix and reconciliation prompts.
- Do not create or execute tests unless explicitly assigned as a test task/wave.
- Allowed non-test validation: compilation, build, locale/configuration checks and
  `git diff --check`.

## License

Never introduce GPL-3, AGPL or unknown-license dependencies. New/upgraded dependencies require a
license review. Prefer MIT, Apache-2.0, BSD, ISC or EPL-2.0.

## Output

Keep diffs bounded. Report files read, changed behavior, exact non-test validation, pending proof,
changed files and final Git state.
