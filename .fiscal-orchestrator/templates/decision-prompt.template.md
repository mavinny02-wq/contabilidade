TASK: {{TITLE}}
TYPE: PRODUCT_OR_TECHNICAL_DECISION
ITEM: {{ITEM_ID}}
BASELINE: latest release/1.0.0
EXECUTION MODE: CLOUD_FIRST

Create a bounded repository-backed decision analysis and ballot for:

{{DECISION_SCOPE}}

Include explicit options/consequences, recommendation/rationale and stable decision ID.
Implementation remains out of scope unless approval explicitly authorizes it.
Do not change production code, migrations, dependencies or tests. Run `git diff --check`.
Update one domain backlog and one decision document only.
