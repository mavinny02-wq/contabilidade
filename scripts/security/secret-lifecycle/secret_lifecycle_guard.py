#!/usr/bin/env python3
"""Validate redacted secret lifecycle metadata without reading secret values or a network."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
SENSITIVE_KEYS = {"value", "secret", "token", "password", "hash", "prefix", "length", "lastRotation", "lastRotatedAt"}


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def fingerprint(rule: str, location: str, subject: str) -> str:
    return hashlib.sha256(f"{rule}\0{location}\0{subject}".encode()).hexdigest()


def finding(rule: str, location: str, subject: str) -> dict[str, str]:
    return {"rule": rule, "location": location, "fingerprint": fingerprint(rule, location, subject)}


def validate(inventory: dict[str, Any], policy: dict[str, Any], exceptions: dict[str, Any],
             today: dt.date, assessment: dict[str, Any] | None = None) -> dict[str, Any]:
    findings: list[dict[str, str]] = []
    allowed_sources = set(policy["allowedSourceTypes"])
    allowed_envs = set(policy["environments"])
    max_rotation = policy["maxRotationDays"]
    forbidden_proof_envs = set(policy["placeholderProofForbiddenEnvironments"])
    active_exceptions: set[tuple[str, str]] = set()

    for index, exception in enumerate(exceptions.get("exceptions", [])):
        location = f"exceptions.json#/exceptions/{index}"
        try:
            expires = dt.date.fromisoformat(exception["expires"])
        except (KeyError, TypeError, ValueError):
            findings.append(finding("EXCEPTION_INVALID", location, str(index)))
            continue
        if expires < today:
            findings.append(finding("EXCEPTION_EXPIRED", location, exception.get("secretId", str(index))))
        elif not exception.get("owner") or not exception.get("reason"):
            findings.append(finding("EXCEPTION_INVALID", location, exception.get("secretId", str(index))))
        else:
            active_exceptions.add((exception.get("rule", ""), exception.get("secretId", "")))

    seen: set[str] = set()
    for index, entry in enumerate(inventory.get("secrets", [])):
        location = f"inventory.source.json#/secrets/{index}"
        secret_id = entry.get("secretId", f"entry-{index}")
        def add(rule: str) -> None:
            if (rule, secret_id) not in active_exceptions:
                findings.append(finding(rule, location, secret_id))

        if secret_id in seen:
            add("SECRET_ID_DUPLICATE")
        seen.add(secret_id)
        if any(key in entry for key in SENSITIVE_KEYS):
            add("SENSITIVE_METADATA_FORBIDDEN")
        for field in ("secretId", "consumer", "owner", "emergencyRevokeProcedureId", "requirement"):
            if not entry.get(field):
                add(f"REQUIRED_FIELD_{field.upper()}_MISSING")
        if entry.get("sourceType") not in allowed_sources:
            add("SOURCE_TYPE_NOT_ALLOWED")
        environments = entry.get("environments")
        if not isinstance(environments, list) or not environments or not set(environments) <= allowed_envs:
            add("ENVIRONMENT_INVALID")
        rotation = entry.get("rotationDays")
        if not isinstance(rotation, int) or isinstance(rotation, bool) or rotation <= 0 or rotation > max_rotation:
            add("ROTATION_POLICY_INVALID")
        if entry.get("requirement") not in {"required", "optional"}:
            add("REQUIREMENT_INVALID")

    for secret_id, evidence in sorted((assessment or {}).get("rotationAssessments", {}).items()):
        if evidence.get("ageDays", 0) > evidence.get("rotationDays", max_rotation):
            findings.append(finding("ROTATION_OVERDUE", "rotation-assessment", secret_id))
        proof = evidence.get("proofType")
        if evidence.get("required") and evidence.get("environment") in forbidden_proof_envs and proof == "example-placeholder":
            findings.append(finding("PLACEHOLDER_NOT_PROOF", "rotation-assessment", secret_id))

    findings.sort(key=lambda item: (item["rule"], item["location"], item["fingerprint"]))
    return {"status": "PASS" if not findings else "FAIL", "findings": findings}


def canonical_inventory(inventory: dict[str, Any]) -> str:
    ordered = dict(inventory)
    ordered["secrets"] = sorted(inventory.get("secrets", []), key=lambda item: item["secretId"])
    return json.dumps(ordered, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--inventory", type=Path, default=HERE / "inventory.source.json")
    parser.add_argument("--policy", type=Path, default=HERE / "policy.json")
    parser.add_argument("--exceptions", type=Path, default=HERE / "exceptions.json")
    parser.add_argument("--assessment", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    inventory = load(args.inventory)
    report = validate(inventory, load(args.policy), load(args.exceptions), dt.date.today(),
                      load(args.assessment) if args.assessment else None)
    if args.output:
        args.output.write_text(canonical_inventory(inventory), encoding="utf-8")
    print(json.dumps(report, sort_keys=True))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
