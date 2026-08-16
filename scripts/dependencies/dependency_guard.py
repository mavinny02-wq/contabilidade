#!/usr/bin/env python3
"""Deterministic SBOM, license and advisory guard (standard library only)."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import date
from pathlib import Path


def read(path: Path) -> dict:
    with path.open(encoding="utf-8") as stream:
        value = json.load(stream)
    if not isinstance(value, dict):
        raise ValueError(f"{path}: expected a JSON object")
    return value


def write(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def normalize(source: Path, target: Path) -> None:
    bom = read(source)
    if bom.get("bomFormat") != "CycloneDX" or not isinstance(bom.get("specVersion"), str):
        raise ValueError(f"{source}: not a CycloneDX JSON document")
    bom.pop("serialNumber", None)
    metadata = bom.get("metadata")
    if isinstance(metadata, dict):
        metadata.pop("timestamp", None)
        metadata.pop("tools", None)
    for key in ("components", "dependencies", "services", "vulnerabilities"):
        if isinstance(bom.get(key), list):
            bom[key].sort(key=lambda item: json.dumps(item, sort_keys=True))
    write(target, bom)


def component_id(component: dict) -> str:
    return str(component.get("purl") or component.get("bom-ref") or component.get("name") or "")


def license_ids(component: dict) -> set[str]:
    result: set[str] = set()
    for entry in component.get("licenses", []):
        if not isinstance(entry, dict):
            continue
        if isinstance(entry.get("expression"), str):
            result.update(re.findall(r"[A-Za-z0-9][A-Za-z0-9.+-]*", entry["expression"]))
            result.difference_update({"AND", "OR", "WITH"})
        license_value = entry.get("license")
        if isinstance(license_value, dict):
            value = license_value.get("id") or license_value.get("name")
            if value:
                result.add(str(value))
    return result or {"UNKNOWN"}


def load_exceptions(path: Path, today: date) -> list[dict]:
    document = read(path)
    if document.get("schemaVersion") != 1 or not isinstance(document.get("exceptions"), list):
        raise ValueError(f"{path}: invalid exception document")
    required = {"component", "version", "reason", "owner", "severity", "expires"}
    exceptions = []
    for index, item in enumerate(document["exceptions"]):
        if not isinstance(item, dict) or set(item) != required or not all(item.values()):
            raise ValueError(f"{path}: exception {index} must contain exactly {sorted(required)}")
        try:
            expires = date.fromisoformat(item["expires"])
        except (TypeError, ValueError) as error:
            raise ValueError(f"{path}: exception {index} has invalid expiry") from error
        item = dict(item)
        item["expired"] = expires < today
        exceptions.append(item)
    return exceptions


def excepted(exceptions: list[dict], component: str, version: str, severity: str) -> bool:
    return any(not item["expired"] and item["component"] == component
               and item["version"] == version and item["severity"].upper() == severity.upper()
               for item in exceptions)


def validate(sboms: list[Path], policy_path: Path, exceptions_path: Path,
             advisory_path: Path | None, today: date) -> None:
    policy = read(policy_path)
    allowed, denied = set(policy["allowed"]), set(policy["denied"])
    review = set(policy["needsReview"])
    exceptions = load_exceptions(exceptions_path, today)
    failures = []
    for sbom_path in sboms:
        bom = read(sbom_path)
        if bom.get("bomFormat") != "CycloneDX" or not isinstance(bom.get("components"), list):
            failures.append(f"{sbom_path}: invalid CycloneDX SBOM")
            continue
        for component in bom["components"]:
            identifier, version = component_id(component), str(component.get("version") or "")
            for license_id in license_ids(component):
                if license_id in allowed:
                    continue
                is_denied = any(license_id == item or license_id.startswith(item + "-") for item in denied)
                severity = "DENIED" if is_denied else "REVIEW"
                if not excepted(exceptions, identifier, version, severity):
                    failures.append(f"{identifier}@{version}: {severity} license {license_id}")
    if advisory_path:
        advisory = read(advisory_path)
        if advisory.get("schemaVersion") != 1 or not isinstance(advisory.get("findings"), list):
            raise ValueError(f"{advisory_path}: invalid advisory report")
        for finding in advisory["findings"]:
            severity = str(finding.get("severity", "UNKNOWN")).upper()
            if severity in {"HIGH", "CRITICAL"} and not excepted(
                    exceptions, str(finding.get("component", "")), str(finding.get("version", "")), severity):
                failures.append(f"{finding.get('component')}@{finding.get('version')}: {severity} advisory")
    expired = [item for item in exceptions if item["expired"]]
    failures.extend(f"{item['component']}@{item['version']}: expired exception" for item in expired)
    if failures:
        raise ValueError("policy violations:\n- " + "\n- ".join(failures))


def make_index(sboms: list[Path], target: Path) -> None:
    entries = []
    for path in sboms:
        bom = read(path)
        component = bom.get("metadata", {}).get("component", {})
        entries.append({"name": component.get("name", path.stem), "path": path.name,
                        "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    write(target, {"schemaVersion": 1, "sboms": sorted(entries, key=lambda item: item["name"])})


def import_trivy(sources: list[Path], target: Path) -> None:
    findings = []
    for source in sources:
        report = read(source)
        for result in report.get("Results", []):
            for vulnerability in result.get("Vulnerabilities") or []:
                findings.append({
                    "advisory": str(vulnerability.get("VulnerabilityID", "UNKNOWN")),
                    "component": str(vulnerability.get("PkgIdentifier", {}).get("PURL")
                                     or vulnerability.get("PkgName", "")),
                    "version": str(vulnerability.get("InstalledVersion", "")),
                    "severity": str(vulnerability.get("Severity", "UNKNOWN")).upper(),
                })
    write(target, {"schemaVersion": 1, "findings": findings})


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    normalizer = subparsers.add_parser("normalize")
    normalizer.add_argument("source", type=Path)
    normalizer.add_argument("target", type=Path)
    indexer = subparsers.add_parser("index")
    indexer.add_argument("target", type=Path)
    indexer.add_argument("sboms", nargs="+", type=Path)
    trivy = subparsers.add_parser("import-trivy")
    trivy.add_argument("target", type=Path)
    trivy.add_argument("reports", nargs="+", type=Path)
    validator = subparsers.add_parser("validate")
    validator.add_argument("--policy", required=True, type=Path)
    validator.add_argument("--exceptions", required=True, type=Path)
    validator.add_argument("--advisories", type=Path)
    validator.add_argument("--today", type=date.fromisoformat, default=date.today())
    validator.add_argument("sboms", nargs="+", type=Path)
    args = parser.parse_args()
    try:
        if args.command == "normalize":
            normalize(args.source, args.target)
        elif args.command == "index":
            make_index(args.sboms, args.target)
        elif args.command == "import-trivy":
            import_trivy(args.reports, args.target)
        else:
            validate(args.sboms, args.policy, args.exceptions, args.advisories, args.today)
    except (OSError, KeyError, ValueError, json.JSONDecodeError) as error:
        print(f"dependency guard: FAIL: {error}", file=sys.stderr)
        return 1
    print(f"dependency guard: PASS ({args.command})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
