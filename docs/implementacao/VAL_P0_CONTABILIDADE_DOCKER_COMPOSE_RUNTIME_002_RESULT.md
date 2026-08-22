# VAL-P0 Contabilidade Docker Compose runtime 002 result

- **Item:** `VAL-P0-CONTABILIDADE-DOCKER-COMPOSE-RUNTIME-002`
- **Status:** `ENVIRONMENT_LIMITATION`
- **Date:** 2026-08-22
- **Observed source:** `origin/codex/bootstrap-deepseek-runner@efd8c614f783ca9c59826c68ab5b18b588424339`

## Outcome

The corrected Cloud launcher was executed from the current trusted internal branch. The Linux/POSIX
preflight no longer treated PowerShell, BAT, Pester, NuGet or Docker Desktop as Cloud requirements.
The Cloud host exposed `sh` and `curl`, but did not expose Docker CLI or a Docker daemon. The task
therefore stopped fail-closed before Compose, exactly as the released shard requires.

This is an environment limitation, not a product failure and not baseline drift. The source commit,
launcher and shard were present and current. No installation was attempted because a CLI alone would
not establish an authorized Docker daemon in the managed Cloud host.

## Evidence

- trusted source and branch resolved successfully;
- local `HEAD` matched the observed remote branch at `efd8c614f783ca9c59826c68ab5b18b588424339`;
- `sh`: available;
- `curl`: available;
- `docker`: unavailable;
- first Compose initialization: `NOT_RUN`;
- second Compose initialization: `NOT_RUN`;
- HTTP and PostgreSQL reuse checks: `NOT_RUN`;
- provider/LLM calls: `NOT_RUN`;
- destructive cleanup, volume removal, reset and external deploy: `NOT_RUN`.

## Regression and limitations

`scripts/orchestration/test_cloud_compose_runtime_launcher.py` passes and prevents a Cloud launcher
from reintroducing PowerShell/BAT as prerequisites. It also fixes both governed Compose invocations:
the first builds and waits; the second waits without cleanup or rebuild.

The runtime gate remains pending until a Codex Cloud project or another authorized Linux host exposes
Docker Engine plus Compose v2. Cloud proof will not replace the separate Windows/Docker Desktop proof
required by `LOCK-STARTUP-001`.

No product, Compose, script, dependency, migration, credential, data or external system was changed.
