#!/usr/bin/env python3
"""Validate the stable Required CI workflow contract without third-party Python packages."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

WORKFLOW = Path(".github/workflows/required-ci.yml")
MANDATORY = {"governance", "backend-postgresql", "frontend", "worker"}


def load_yaml(path: Path) -> dict:
    ruby = "require 'yaml'; require 'json'; puts JSON.generate(YAML.safe_load(File.read(ARGV[0]), aliases: true))"
    result = subprocess.run(
        ["ruby", "-e", ruby, str(path)], text=True, capture_output=True, check=False
    )
    if result.returncode:
        raise ValueError(f"invalid YAML: {result.stderr.strip()}")
    return json.loads(result.stdout)


def commands(job: dict) -> str:
    return "\n".join(str(step.get("run", "")) for step in job.get("steps", []))


def validate(path: Path = WORKFLOW) -> list[str]:
    try:
        workflow = load_yaml(path)
    except (ValueError, json.JSONDecodeError) as exc:
        return [str(exc)]

    errors: list[str] = []
    if workflow.get("name") != "Required CI":
        errors.append("workflow name must be 'Required CI'")
    jobs = workflow.get("jobs", {})
    missing = MANDATORY - jobs.keys()
    if missing:
        errors.append(f"mandatory lanes missing: {', '.join(sorted(missing))}")
    final = jobs.get("required-ci", {})
    needs = final.get("needs", [])
    if isinstance(needs, str):
        needs = [needs]
    if set(needs) != MANDATORY:
        errors.append("required-ci must need exactly every mandatory lane")
    if str(final.get("if", "")).strip() != "always()":
        errors.append("required-ci must use if: always()")
    if "all(result == \"success\"" not in commands(final):
        errors.append("required-ci must fail unless every needed job succeeded")
    for lane in MANDATORY:
        job = jobs.get(lane, {})
        if job.get("continue-on-error") is not None or any(
            step.get("continue-on-error") is not None for step in job.get("steps", [])
        ):
            errors.append(f"{lane} must not declare continue-on-error")
    backend = commands(jobs.get("backend-postgresql", {}))
    if not all(token in backend for token in ("docker info", "mvn -B clean verify", "failIfNoTests=true")):
        errors.append("backend must run the explicit Docker/Testcontainers PostgreSQL proof")
    worker = commands(jobs.get("worker", {}))
    if not all(token in worker for token in ("playwright@1.60.0 install", "chromium", "npm test", "npm run typecheck", "npm run build")):
        errors.append("worker must provision Chromium and run its complete test/typecheck/build proof")
    return errors


if __name__ == "__main__":
    failures = validate(Path(sys.argv[1]) if len(sys.argv) > 1 else WORKFLOW)
    if failures:
        print("\n".join(f"ERROR: {failure}" for failure in failures), file=sys.stderr)
        raise SystemExit(1)
    print("Required CI contract is valid.")
