# Fiscal Operations Platform — orchestration bootstrap

This package establishes the same governed delivery style used in EUCO Rail while keeping the new
product independent from the rail domain.

## Working assumptions

- Working product name: **Fiscal Operations Platform**.
- Technical identifier: `fiscal-platform`.
- Canonical file prefix: `FISCAL_PLATFORM`.
- Integration branch: `release/1.0.0`.
- The target repository begins as a copy or extraction of the latest approved EUCO Rail baseline.
- The first Codex task is documentation and repository analysis only.
- Production-code extraction/removal begins only after that analysis is integrated.

The working name is generic and can later be changed through one explicit product-identity task.

## Installation

1. Create the new repository/worktree from the desired EUCO Rail baseline.
2. Extract this ZIP into the repository root, preserving paths.
3. Review `.fiscal-orchestrator/config.json` and edit only repository-specific values.
4. Commit the bootstrap package.
5. Send `PROMPT_00_BOOTSTRAP_REPOSITORY_AND_ORCHESTRATION.md` to Codex Cloud.
6. Review and merge the documentation PR.
7. Run `scripts/export-fiscal-platform-wave.bat` after integrated waves to generate:
   - `fiscal-platform-wave-evidence.zip`;
   - `fiscal-platform-docs-editable.zip`.
8. Reconcile returned documentation and commit it before the next official wave.

## Permanent delivery rules

- Official waves contain exactly five independent slots.
- Every slot starts from the same latest `release/1.0.0`.
- Slots cannot depend on one another or overlap critical owned files.
- Extras are optional, urgent and do not count in the five slots.
- Shared reconciliation is serialized.
- Analysis, implementation, bug fixing, testing, decisions and reconciliation use separate prompts.
- Implementation and bug-fix prompts do not request test creation or execution.
- Test work remains tagged until a dedicated test task or test wave is requested.
- Compilation, build, locale/configuration validation and `git diff --check` are allowed when
  proportionate.
