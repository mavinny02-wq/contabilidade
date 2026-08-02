TASK: {{TITLE}}
TYPE: ANALYSIS
ITEM: {{ITEM_ID}}
BASELINE: latest release/1.0.0
EXECUTION MODE: CLOUD_FIRST

Work only in the supplied repository. Read all applicable `AGENTS.md`, canonical authorities and
current source/configuration.

Analyze only:

{{SCOPE}}

Create exactly one evidence document: `{{EVIDENCE_DOCUMENT}}`.
Update only: `{{DOMAIN_BACKLOG}}`.

Do not change production code, tests, migrations, dependencies or runtime configuration.
Do not execute tests. Validate documentation structure and run `git diff --check`.
Register bugs/debts only when evidence supports them.
