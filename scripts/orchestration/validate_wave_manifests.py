#!/usr/bin/env python3
"""Validate immutable wave manifests and their repository lifecycle."""
from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path, PurePosixPath

STATES = {
    "prepared": "PREPARED_NOT_RELEASED",
    "released": "RELEASED_FOR_EXECUTION",
    "consumed": "CONSUMED",
    "superseded": "SUPERSEDED",
}
SHA = re.compile(r"^[0-9a-f]{40}$")
LOCK = re.compile(r"^LOCK-[A-Z0-9-]+$")
WAVE_ID = re.compile(r"^[A-Z][A-Z0-9_]*$")
RESULT_PATH = re.compile(r"^docs/(implementacao|testing/runs)/[^/]+\.md$")


@dataclass(frozen=True)
class Finding:
    code: str
    path: str
    message: str


def _add(findings: list[Finding], code: str, path: Path | str, message: str) -> None:
    findings.append(Finding(code, str(path), message))


def validate_document(data: object, path: Path) -> list[Finding]:
    findings: list[Finding] = []
    if not isinstance(data, dict):
        return [Finding("MANIFEST_TYPE", str(path), "manifest must be a JSON object")]
    allowed = {"schemaVersion", "waveId", "state", "baseline", "owners", "launcherPath", "previousManifest", "supersedes"}
    unknown = sorted(set(data) - allowed)
    if unknown:
        _add(findings, "UNKNOWN_FIELD", path, f"remove unsupported fields: {', '.join(unknown)}")
    if data.get("schemaVersion") != "1.0":
        _add(findings, "SCHEMA_VERSION", path, "schemaVersion must be 1.0")
    wave_id = data.get("waveId")
    if not isinstance(wave_id, str) or not WAVE_ID.fullmatch(wave_id):
        _add(findings, "WAVE_ID", path, "waveId must match ^[A-Z][A-Z0-9_]*$")
    state = data.get("state")
    expected = STATES.get(path.parent.name)
    if state not in STATES.values():
        _add(findings, "STATE_INVALID", path, "state must be a supported lifecycle state")
    elif expected and state != expected:
        _add(findings, "STATE_PATH_MISMATCH", path, f"move manifest to {state.lower()} lifecycle directory or set state to {expected}")

    baseline = data.get("baseline")
    if not isinstance(baseline, dict) or set(baseline) != {"branch", "commit"}:
        _add(findings, "BASELINE_INVALID", path, "baseline must contain only branch and commit")
    elif not isinstance(baseline["branch"], str) or not baseline["branch"] or not isinstance(baseline["commit"], str) or not SHA.fullmatch(baseline["commit"]):
        _add(findings, "BASELINE_INVALID", path, "baseline.branch must be non-empty and baseline.commit a 40-character lowercase SHA")

    owners = data.get("owners")
    if not isinstance(owners, list) or not 1 <= len(owners) <= 5:
        _add(findings, "OWNER_CAPACITY", path, "owners must contain between one and five executable owners (LOCK-WAVE-001)")
        owners = []
    items: set[str] = set()
    owner_names: set[str] = set()
    migrations = 0
    owner_fields = {"item", "owner", "locks", "migration", "resultPath"}
    for index, owner in enumerate(owners):
        location = f"{path}#owners/{index}"
        if not isinstance(owner, dict) or set(owner) != owner_fields:
            _add(findings, "OWNER_INVALID", location, "owner must contain only item, owner, locks, migration and resultPath")
            continue
        if not all(isinstance(owner[key], str) and owner[key] for key in ("item", "owner", "resultPath")):
            _add(findings, "OWNER_INVALID", location, "item, owner and resultPath must be non-empty strings")
        elif not RESULT_PATH.fullmatch(owner["resultPath"]):
            _add(findings, "RESULT_PATH", location, "resultPath must be a Markdown file under docs/implementacao or docs/testing/runs")
        locks = owner["locks"]
        if not isinstance(locks, list) or any(not isinstance(lock, str) or not LOCK.fullmatch(lock) for lock in locks) or len(locks) != len(set(locks)):
            _add(findings, "LOCKS_INVALID", location, "locks must be unique LOCK-* identifiers")
        if not isinstance(owner["migration"], bool):
            _add(findings, "MIGRATION_FLAG", location, "migration must be boolean")
        elif owner["migration"]:
            migrations += 1
        if owner["item"] in items or owner["owner"] in owner_names:
            _add(findings, "OWNER_DUPLICATE", location, "item and owner must each be unique within a wave")
        items.add(owner["item"])
        owner_names.add(owner["owner"])
    if migrations > 1:
        _add(findings, "MIGRATION_OWNER_LIMIT", path, "at most one owner may have migration=true (LOCK-MIG-001)")

    if state == "PREPARED_NOT_RELEASED" and "launcherPath" in data:
        _add(findings, "PREPARED_HAS_LAUNCHER", path, "remove launcherPath; prepared waves cannot contain executable launchers")
    if state == "RELEASED_FOR_EXECUTION" and not data.get("launcherPath"):
        _add(findings, "RELEASED_WITHOUT_LAUNCHER", path, "released waves must declare launcherPath")
    if state == "RELEASED_FOR_EXECUTION" and not data.get("previousManifest"):
        _add(findings, "RELEASE_WITHOUT_REFRESH", path, "released waves must reference the refreshed prepared manifest")
    if state in {"CONSUMED", "SUPERSEDED"} and not data.get("previousManifest"):
        _add(findings, "TERMINAL_WITHOUT_PREVIOUS", path, "terminal manifests must declare previousManifest")
    if state == "SUPERSEDED" and not data.get("supersedes"):
        _add(findings, "SUPERSESSION_MISSING", path, "superseded manifests must identify the successor in supersedes")
    return findings


def validate_repository(root: Path) -> list[Finding]:
    waves = root / "docs/orquestracao/waves"
    findings: list[Finding] = []
    manifests: list[tuple[Path, dict]] = []
    for directory in STATES:
        for path in sorted((waves / directory).glob("*.json")):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                _add(findings, "JSON_INVALID", path.relative_to(root), str(exc))
                continue
            relative = path.relative_to(root)
            findings.extend(validate_document(data, relative))
            if isinstance(data, dict):
                manifests.append((relative, data))

    by_id: dict[str, list[tuple[Path, dict]]] = {}
    for entry in manifests:
        if isinstance(entry[1].get("waveId"), str):
            by_id.setdefault(entry[1]["waveId"], []).append(entry)
    for wave_id, entries in by_id.items():
        states = {data.get("state") for _, data in entries}
        if "RELEASED_FOR_EXECUTION" in states and states & {"CONSUMED", "SUPERSEDED"}:
            _add(findings, "TERMINAL_REPLAY", entries[0][0], f"{wave_id} is terminal and cannot remain released")
        if "CONSUMED" in states and "SUPERSEDED" in states:
            _add(findings, "TERMINAL_CONFLICT", entries[0][0], f"{wave_id} cannot be both consumed and superseded")
    for path, data in manifests:
        previous = data.get("previousManifest")
        if previous and (PurePosixPath(previous).is_absolute() or ".." in PurePosixPath(previous).parts):
            _add(findings, "PREVIOUS_PATH_INVALID", path, "previousManifest must be a repository-relative path without '..'")
    return findings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    args = parser.parse_args()
    findings = validate_repository(args.repo_root.resolve())
    for item in findings:
        print(f"ERROR {item.code} {item.path}: {item.message}")
    print(f"Wave manifests: {'FAIL' if findings else 'PASS'} ({len(findings)} errors)")
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
