#!/usr/bin/env python3
"""Offline validator for immutable release promotion bundles."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
SHA256 = re.compile(r"^[0-9a-f]{64}$")
DIGEST = re.compile(r"^sha256:[0-9a-f]{64}$")
COMMIT = re.compile(r"^[0-9a-f]{40}$")
STAMP = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")


def repository_commit() -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, check=True, text=True, capture_output=True
    ).stdout.strip()


def flyway_frontier() -> int:
    migrations = ROOT / "backend/src/main/resources/db/migration"
    versions = [int(match.group(1)) for path in migrations.glob("V*__*.sql")
                if (match := re.match(r"V(\d+)__", path.name))]
    if not versions:
        raise ValueError("repository has no numeric Flyway migrations")
    return max(versions)


def _parse_stamp(value: object, field: str, errors: list[str]) -> dt.datetime | None:
    if not isinstance(value, str) or not STAMP.fullmatch(value):
        errors.append(f"{field} must be normalized UTC (YYYY-MM-DDTHH:MM:SSZ)")
        return None
    return dt.datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc)


def validate(bundle: object, *, expected_version: str, expected_commit: str,
             target_frontier: int, now: dt.datetime,
             expected_digests: dict[str, str] | None = None) -> list[str]:
    errors: list[str] = []
    if not isinstance(bundle, dict):
        return ["bundle must be a JSON object"]
    required = {"releaseVersion", "gitCommit", "createdAt", "components", "flywayFrontier",
                "sourceEnvironment", "targetEnvironment", "evidenceIds", "rollbackTarget"}
    missing = sorted(required - bundle.keys())
    if missing:
        errors.append("missing fields: " + ", ".join(missing))
    if bundle.get("releaseVersion") != expected_version:
        errors.append("releaseVersion diverges from VERSION")
    if bundle.get("gitCommit") != expected_commit or not COMMIT.fullmatch(str(bundle.get("gitCommit", ""))):
        errors.append("gitCommit diverges from the authorized repository SHA")
    _parse_stamp(bundle.get("createdAt"), "createdAt", errors)

    policy = json.loads((HERE / "policy.v1.json").read_text())
    components = bundle.get("components")
    if not isinstance(components, list):
        errors.append("components must be an array")
        components = []
    names = [item.get("name") for item in components if isinstance(item, dict)]
    duplicates = sorted({name for name in names if names.count(name) > 1})
    if duplicates:
        errors.append("duplicate components: " + ", ".join(duplicates))
    absent = sorted(set(policy["requiredComponents"]) - set(names))
    if absent:
        errors.append("missing required components: " + ", ".join(absent))
    for index, component in enumerate(components):
        if not isinstance(component, dict):
            errors.append(f"components[{index}] must be an object")
            continue
        prefix = f"component {component.get('name', index)}"
        repository = component.get("imageRepository")
        if not isinstance(repository, str) or not repository or "@" in repository or "://" in repository:
            errors.append(f"{prefix} has invalid imageRepository")
        if not DIGEST.fullmatch(str(component.get("imageDigest", ""))):
            errors.append(f"{prefix} imageDigest must be an immutable sha256 digest")
        elif expected_digests is not None and expected_digests.get(str(component.get("name"))) != component["imageDigest"]:
            errors.append(f"{prefix} imageDigest diverges from the promoted artifact inventory")
        for field in ("sbomSha256", "provenanceSha256"):
            if not SHA256.fullmatch(str(component.get(field, ""))):
                errors.append(f"{prefix} {field} must be SHA-256")

    frontier = bundle.get("flywayFrontier")
    if not isinstance(frontier, int) or isinstance(frontier, bool):
        errors.append("flywayFrontier must be an integer")
    else:
        if frontier != flyway_frontier():
            errors.append("flywayFrontier diverges from repository migrations")
        if frontier < target_frontier:
            errors.append("promotion would downgrade the target Flyway frontier")
    rollback = bundle.get("rollbackTarget")
    if not isinstance(rollback, dict):
        errors.append("rollbackTarget must be an object")
    elif not isinstance(rollback.get("flywayFrontier"), int) or rollback["flywayFrontier"] < target_frontier:
        errors.append("rollback target is below the applied Flyway frontier")

    transition = f"{bundle.get('sourceEnvironment')}->{bundle.get('targetEnvironment')}"
    allowed = {f"{item['source']}->{item['target']}" for item in policy["allowedTransitions"]}
    if transition not in allowed:
        exception = bundle.get("exception")
        if not isinstance(exception, dict):
            errors.append(f"transition {transition} requires an exception")
        else:
            for field in ("owner", "reason"):
                if not isinstance(exception.get(field), str) or not exception[field].strip():
                    errors.append(f"exception.{field} is required")
            if exception.get("transition") != transition:
                errors.append("exception transition does not match the promotion")
            expiry = _parse_stamp(exception.get("expiresAt"), "exception.expiresAt", errors)
            if expiry is not None and expiry <= now:
                errors.append("exception has expired")
    evidence = bundle.get("evidenceIds")
    if not isinstance(evidence, list) or not evidence or any(not isinstance(x, str) or not x for x in evidence):
        errors.append("evidenceIds must contain non-empty identifiers")
    return sorted(set(errors))


def report(bundle_path: Path, errors: list[str], output_format: str) -> str:
    payload = {"bundleSha256": hashlib.sha256(bundle_path.read_bytes()).hexdigest(),
               "errors": errors, "status": "PASS" if not errors else "FAIL"}
    if output_format == "json":
        return json.dumps(payload, indent=2, sort_keys=True) + "\n"
    lines = ["# Release promotion validation", "", f"- Status: `{payload['status']}`",
             f"- Bundle SHA-256: `{payload['bundleSha256']}`", "", "## Findings", ""]
    lines.extend([f"- {error}" for error in errors] or ["- No findings."])
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path)
    parser.add_argument("--target-frontier", required=True, type=int)
    parser.add_argument("--expected-digests", required=True, type=Path,
                        help="trusted JSON map of component names to built image digests")
    parser.add_argument("--expected-version", default=(ROOT / "VERSION").read_text().strip())
    parser.add_argument("--expected-commit", default=None)
    parser.add_argument("--now", help="normalized UTC time; required for reproducible exception checks")
    parser.add_argument("--format", choices=("json", "markdown"), default="json")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    now_text = args.now or dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    now = dt.datetime.strptime(now_text, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc)
    bundle = json.loads(args.bundle.read_text())
    errors = validate(bundle, expected_version=args.expected_version,
                      expected_commit=args.expected_commit or repository_commit(),
                      target_frontier=args.target_frontier, now=now,
                      expected_digests=json.loads(args.expected_digests.read_text()))
    rendered = report(args.bundle, errors, args.format)
    if args.output:
        args.output.write_text(rendered)
    else:
        print(rendered, end="")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
