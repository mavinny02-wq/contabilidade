#!/usr/bin/env python3
"""Generate and validate the repository's governed synthetic fixtures."""

import argparse
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CATALOG = Path(__file__).with_name("synthetic-fixtures.catalog.json")
FIXTURE_ROOT = Path(__file__).with_name("fixtures")
REQUIRED_METADATA = {
    "synthetic",
    "schema_id",
    "schema_version",
    "purpose",
    "owner",
    "generator",
    "seed",
    "fixed_at",
    "sensitivity",
    "checksum_sha256",
}
RESERVED_DOMAINS = {"example.com", "example.org", "example.net"}
TAX_ID = re.compile(r"(?<!\d)(?:\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2})(?!\d)")
EMAIL = re.compile(r"\b[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@([A-Za-z0-9.-]+)\b")


class FixtureError(ValueError):
    """A fixture violates the synthetic-data contract."""


def canonical_bytes(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode()


def checksum(value):
    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def generated_content(seed):
    """Return stable content without relying on ambient time or randomness."""
    if seed != "str-data-001/company/v1":
        raise FixtureError("unknown generator seed")
    return {
        "company_id": "00000000-0000-5000-8000-000000000001",
        "company_name": "EMPRESA EXPLICITAMENTE FICTICIA LTDA",
        "contact_email": "contato@example.invalid",
        "status": "synthetic-active",
    }


def generated_document(entry):
    content = generated_content(entry["seed"])
    metadata = {
        "synthetic": True,
        "schema_id": entry["schema_id"],
        "schema_version": entry["schema_version"],
        "purpose": entry["purpose"],
        "owner": entry["owner"],
        "generator": "scripts/testing/synthetic_fixture_guard.py",
        "seed": entry["seed"],
        "fixed_at": entry["fixed_at"],
        "sensitivity": "PUBLIC_SYNTHETIC",
        "checksum_sha256": checksum(content),
    }
    return {"metadata": metadata, "content": content}


def _security_rules():
    path = ROOT / "scripts/security/secret_pii_guard.py"
    spec = importlib.util.spec_from_file_location("repository_secret_pii_guard", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.RULES, module.fingerprint


def safe_findings(value):
    """Return only redacted rule fingerprints, never matched data."""
    text = json.dumps(value, ensure_ascii=False, sort_keys=True)
    rules, fingerprint = _security_rules()
    findings = []
    for rule, regex in rules.items():
        for match in regex.finditer(text):
            findings.append({"rule": rule, "fingerprint": fingerprint(rule, match.group(0))})
    for match in EMAIL.finditer(text):
        domain = match.group(1).lower()
        if not (domain.endswith(".invalid") or domain in RESERVED_DOMAINS):
            findings.append({"rule": "non-reserved-email-domain", "fingerprint": fingerprint("domain", domain)})
    return findings


def validate_document(document, entry):
    metadata = document.get("metadata", {})
    missing = sorted(REQUIRED_METADATA - metadata.keys())
    if missing:
        raise FixtureError("missing metadata fields: " + ", ".join(missing))
    if metadata["synthetic"] is not True:
        raise FixtureError("fixture is not explicitly synthetic")
    if metadata["seed"] != entry["seed"]:
        raise FixtureError("fixture seed differs from catalog")
    if metadata["checksum_sha256"] != checksum(document.get("content")):
        raise FixtureError("normalized content checksum mismatch")
    if metadata["checksum_sha256"] != entry["checksum_sha256"]:
        raise FixtureError("fixture checksum differs from catalog")
    if TAX_ID.search(json.dumps(document.get("content"), ensure_ascii=False)) and not metadata.get("synthetic_tax_ids"):
        raise FixtureError("tax identifier is not marked synthetic")
    findings = safe_findings(document)
    if findings:
        details = ", ".join(f"{item['rule']}[{item['fingerprint']}]" for item in findings)
        raise FixtureError("possible real or sensitive data (redacted): " + details)
    if canonical_bytes(document) != canonical_bytes(generated_document(entry)):
        raise FixtureError("fixture is not deterministic for catalog seed")


def validate(catalog_path=CATALOG, fixture_root=FIXTURE_ROOT):
    catalog = json.loads(Path(catalog_path).read_text(encoding="utf-8"))
    entries = catalog.get("fixtures", [])
    catalog_paths = {entry["path"] for entry in entries}
    disk_paths = {path.relative_to(fixture_root).as_posix() for path in Path(fixture_root).glob("*.json")}
    if catalog_paths != disk_paths:
        raise FixtureError("catalog and authorized fixture paths differ")
    for entry in entries:
        document = json.loads((Path(fixture_root) / entry["path"]).read_text(encoding="utf-8"))
        validate_document(document, entry)
    return {"fixtures": len(entries), "schemas": len({e["schema_id"] for e in entries})}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--generate", action="store_true")
    args = parser.parse_args()
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    if args.generate:
        for entry in catalog["fixtures"]:
            (FIXTURE_ROOT / entry["path"]).write_bytes(canonical_bytes(generated_document(entry)))
    try:
        result = validate()
    except (FixtureError, KeyError, json.JSONDecodeError) as error:
        print(f"synthetic fixture guard: fail: {error}", file=sys.stderr)
        return 1
    print(f"synthetic fixture guard: pass ({result['fixtures']} fixtures, {result['schemas']} schemas)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
