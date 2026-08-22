# Linux Compose runtime host result

- **Item:** `BUG-CI-CONTABILIDADE-LINUX-COMPOSE-RUNTIME-HOST-001`
- **Status:** `IMPLEMENTED_STRUCTURAL_GREEN_RUNTIME_TRIGGER_PENDING`
- **Date:** 2026-08-22

## Outcome

The generic Codex Cloud host correctly consumed the POSIX launcher but exposed no Docker CLI or
daemon. Repeating that task cannot prove the Compose runtime. The internal startup workflow now has
a bounded Linux runtime job on a GitHub-hosted `ubuntu-latest` runner, where Docker Engine and
Compose v2 are part of the governed execution environment.

The job uses only `compose.yaml` plus `compose.dev.yaml`, starts once with build, verifies real HTTP
health and Flyway V12, starts again without rebuild or cleanup, and requires reuse of the PostgreSQL
container and named volume. It never invokes PowerShell/BAT and contains no `down`, volume removal,
prune, reset, provider or external deploy operation. The separate Windows/Docker Desktop gate remains
unchanged and authoritative for `LOCK-STARTUP-001`.

## Owners

- `.github/workflows/startup-reliability.yml`
- `scripts/orchestration/test_cloud_compose_runtime_launcher.py`
- this RESULT

## Structural validation

- Cloud launcher/workflow regression: PASS, 2 tests;
- Docker orchestration guard: PASS, 19 contracts;
- Docker orchestration regressions: PASS, 10 tests;
- startup actions guard: PASS, 6 contracts;
- startup actions regressions: PASS, 9 tests;
- required CI contract: PASS;
- `git diff --check`: PASS.

The Linux runtime itself is pending the workflow triggered by the integration commit. A successful
hosted run will prove only the Cloud/Linux Compose gate; it will not replace the required Windows
runtime proof.
