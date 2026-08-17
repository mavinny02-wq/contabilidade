#!/usr/bin/env python3
"""Deterministic, redacted inventory and environment contract guard."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
POLICY = Path(__file__).with_name("environment-policy.v1.json")
EXAMPLE_MARKERS = ("altere-esta-senha", "altere-este-token", "altere-este-segredo")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def service_names(text: str) -> set[str]:
    match = re.search(r"(?m)^services:\s*$", text)
    if not match:
        return set()
    return set(re.findall(r"(?m)^  ([a-zA-Z0-9_-]+):\s*$", text[match.end() :]))


def finding(code: str, path: str, correction: str) -> str:
    return f"ERROR {code} {path}: {correction}"


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    base = read(root / "compose.yaml")
    dev = read(root / "compose.dev.yaml")
    onprem = read(root / "compose.onpremise.yaml")
    deploy = read(root / "scripts/deploy-contabilidade-onpremise.ps1")
    env_example = read(root / ".env.example")
    ci = read(root / ".github/workflows/environment-governance.yml")

    dev_effective = service_names(base) - {"keycloak", "postgres-bootstrap"}
    required_dev = {"postgres", "backend", "automation-worker", "frontend"}
    if not required_dev <= dev_effective:
        errors.append(finding("DEV_STACK_INCOMPLETE", "compose.yaml", "declare the four minimum dev services"))
    if not re.search(r'APP_SECURITY_ENABLED:\s*["\']?false', dev):
        errors.append(finding("DEV_AUTH_NOT_DISABLED", "compose.dev.yaml", "set APP_SECURITY_ENABLED to false only in dev"))
    if "keycloak:" in dev or "postgres-bootstrap:" in dev:
        errors.append(finding("DEV_IDP_PRESENT", "compose.dev.yaml", "remove Keycloak/bootstrap from the dev overlay"))
    if re.search(r"SERPRO_CND_ALLOW_STATIC_BEARER:\s*(?:true|\$\{[^}]*:-true\})", base, re.I):
        errors.append(finding("PROVIDER_DEFAULT_ENABLED", "compose.yaml", "default every real provider switch to false"))

    if ("keycloak" not in service_names(base) or "SPRING_PROFILES_ACTIVE: onpremise" not in onprem
            or re.search(r'APP_SECURITY_ENABLED:\s*["\']?false', onprem)):
        errors.append(finding("ONPREMISE_AUTH_REQUIRED", "compose.onpremise.yaml", "require Keycloak and the onpremise profile"))
    if not re.search(r"Nenhum build sera executado|Nenhum build será executado", deploy):
        errors.append(finding("ONPREMISE_BUILD_ALLOWED", "scripts/deploy-contabilidade-onpremise.ps1", "deploy published images without server-side builds"))
    if not all(marker in deploy and marker in env_example for marker in EXAMPLE_MARKERS):
        errors.append(finding("EXAMPLE_SECRET_ACCEPTED", "scripts/deploy-contabilidade-onpremise.ps1", "reject every documented example-secret marker"))
    if re.search(r"(?im)^\s*(docker|mvn|npm)\s+(?:build|package|install|ci)\b", deploy):
        errors.append(finding("ONPREMISE_BUILD_COMMAND", "scripts/deploy-contabilidade-onpremise.ps1", "remove build/install commands from deploy"))
    if re.search(r"(?im)^\s*(?:PUBLIC_BASE_URL|APP_CORS_ALLOWED_ORIGINS)=\s*(?:\*|https?://0\.0\.0\.0)", env_example):
        errors.append(finding("UNSAFE_PUBLIC_ENDPOINT", ".env.example", "use an explicit reviewed origin"))
    if 'CI_SYNTHETIC_DATA_ONLY: "true"' not in ci or 'CI_EXTERNAL_NETWORK_DEFAULT: "false"' not in ci:
        errors.append(finding("CI_ISOLATION_DRIFT", ".github/workflows/environment-governance.yml", "require synthetic data and deny external network by default"))
    return errors


def inventory(root: Path) -> dict[str, object]:
    policy = json.loads(read(POLICY))
    paths = sorted({p for env in policy["environments"].values() for p in env["files"]} | {".env.example"})
    files = [{"path": p, "sha256": hashlib.sha256((root / p).read_bytes()).hexdigest()} for p in paths]
    return {"schemaVersion": 1, "policySha256": hashlib.sha256(POLICY.read_bytes()).hexdigest(), "files": files}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--inventory", type=Path)
    args = parser.parse_args()
    errors = validate(args.root.resolve())
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    payload = json.dumps(inventory(args.root.resolve()), indent=2, sort_keys=True) + "\n"
    if args.inventory:
        args.inventory.write_text(payload, encoding="utf-8", newline="\n")
    else:
        print(payload, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
