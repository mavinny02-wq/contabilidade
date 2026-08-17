#!/usr/bin/env python3
"""Generate and validate the repository IAM contract without contacting an IdP."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
SECURITY = ROOT / "backend/src/main/java/br/com/contabilidade/common/security"
REALMS = (ROOT / "infra/keycloak/realm-contabilidade.json", ROOT / "infra/keycloak/realm-contabilidade-dev.json")
POLICY = Path(__file__).with_name("policy.json")
DEFAULT_INVENTORY = Path(__file__).with_name("inventory.json")
CONST = re.compile(r'public static final String\s+(\w+)\s*=\s*"([A-Z0-9_]+)"')
PERMISSION_USE = re.compile(r"@permissaoService\.tem\('([A-Z0-9_]+)'\)")
MAPPING = re.compile(r'case\s+((?:"[^"]+"(?:,\s*)?)+)\s*->\s*Papeis\.(\w+)')
PUBLIC_MATCHER = re.compile(r'\.requestMatchers\((.*?)\)\.permitAll\(\)')


@dataclass(frozen=True)
class Finding:
    code: str
    location: str
    detail: str


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def constants(path: Path) -> dict[str, str]:
    return dict(CONST.findall(read(path)))


def public_routes(source: str) -> list[dict[str, str]]:
    routes: list[dict[str, str]] = []
    for arguments in PUBLIC_MATCHER.findall(source):
        method_match = re.match(r'HttpMethod\.(\w+)\s*,\s*', arguments)
        method = method_match.group(1) if method_match else "*"
        paths = re.findall(r'"([^"\n]+)"', arguments)
        routes.extend({"method": method, "path": path} for path in paths)
    return sorted(routes, key=lambda item: (item["path"], item["method"]))


def inventory(root: Path = ROOT) -> dict[str, Any]:
    security = root / SECURITY.relative_to(ROOT)
    policy = json.loads(read(root / POLICY.relative_to(ROOT)))
    roles = constants(security / "Papeis.java")
    permissions = constants(security / "Permissoes.java")
    converter = read(security / "JwtAuthoritiesConverter.java")
    mappings: dict[str, str] = {}
    for aliases, role_constant in MAPPING.findall(converter):
        for alias in re.findall(r'"([^"]+)"', aliases):
            mappings[alias] = roles.get(role_constant, role_constant)
    uses: list[dict[str, Any]] = []
    for path in sorted((root / "backend/src/main/java").rglob("*Controller.java")):
        found = sorted(set(PERMISSION_USE.findall(read(path))))
        if found:
            uses.append({"file": path.relative_to(root).as_posix(), "permissions": found})
    realms = []
    for realm_path in (root / "infra/keycloak/realm-contabilidade.json", root / "infra/keycloak/realm-contabilidade-dev.json"):
        realm = json.loads(read(realm_path))
        realms.append({
            "file": realm_path.relative_to(root).as_posix(),
            "realm": realm.get("realm"),
            "roles": sorted(role.get("name") for role in realm.get("roles", {}).get("realm", [])),
        })
    return {
        "schema_version": 1,
        "roles": [{"id": value, "symbol": key} for key, value in sorted(roles.items())],
        "permissions": [{"id": value, "symbol": key} for key, value in sorted(permissions.items())],
        "permission_uses": uses,
        "jwt": {
            "accepted_claims": policy["expected_claims"],
            "role_aliases": dict(sorted(mappings.items())),
            "unknown_role_policy": "passthrough" if 'default -> role.startsWith("ROLE_")' in converter else "reject",
        },
        "public_routes": public_routes(read(security / "SecurityConfig.java")),
        "realms": realms,
        "worker": policy["worker"],
        "dev_auth_disabled_contract": policy["dev_auth_disabled_contract"],
    }


def duplicates(values: list[str]) -> set[str]:
    return {value for value in values if values.count(value) > 1}


def safe_identifier(value: Any) -> str:
    """Expose only contract-shaped identifiers, never arbitrary claim or fixture content."""
    text = str(value)
    return text if re.fullmatch(r"[A-Za-z0-9_./*<>:-]{1,100}", text) else "<redacted>"


def validate(data: dict[str, Any], policy: dict[str, Any], root: Path = ROOT) -> list[Finding]:
    findings: list[Finding] = []
    role_ids = [item["id"] for item in data.get("roles", [])]
    permission_ids = [item["id"] for item in data.get("permissions", [])]
    for value in sorted(duplicates(role_ids)):
        findings.append(Finding("DUPLICATE_ROLE", "roles", f"duplicate role id: {value}"))
    for value in sorted(duplicates(permission_ids)):
        findings.append(Finding("DUPLICATE_PERMISSION", "permissions", f"duplicate permission id: {value}"))
    known = set(permission_ids)
    for use in data.get("permission_uses", []):
        for permission in use.get("permissions", []):
            if permission not in known:
                findings.append(Finding("UNKNOWN_PERMISSION", use.get("file", "controller"), f"permission is not catalogued: {safe_identifier(permission)}"))
    expected_mapping = policy["realm_role_mapping"]
    backend_roles = set(role_ids)
    for realm in data.get("realms", []):
        for role in realm.get("roles", []):
            mapped = expected_mapping.get(role)
            if mapped is None:
                findings.append(Finding("UNMAPPED_REALM_ROLE", realm["file"], f"realm role has no explicit mapping: {safe_identifier(role)}"))
            elif mapped not in backend_roles:
                findings.append(Finding("MISSING_BACKEND_ROLE", realm["file"], f"mapped backend role does not exist: {mapped}"))
        missing = sorted(set(expected_mapping) - set(realm.get("roles", [])))
        for role in missing:
            findings.append(Finding("MISSING_REALM_ROLE", realm["file"], f"expected realm role is absent: {role}"))
    expected_routes = {(item["method"], item["path"]) for item in policy["public_routes"]}
    actual_routes = {(item["method"], item["path"]) for item in data.get("public_routes", [])}
    for method, path in sorted(actual_routes - expected_routes):
        findings.append(Finding("UNEXPECTED_PUBLIC_ROUTE", "SecurityConfig.java", f"public route is not allowlisted: {method} {path}"))
    for method, path in sorted(expected_routes - actual_routes):
        findings.append(Finding("MISSING_PUBLIC_ROUTE", "SecurityConfig.java", f"allowlisted public route is absent: {method} {path}"))
    security_config = read(root / SECURITY.relative_to(ROOT) / "SecurityConfig.java")
    if ".anyRequest().authenticated()" not in security_config:
        findings.append(Finding("MISSING_AUTHENTICATED_FALLBACK", "SecurityConfig.java", "protected endpoint fallback is absent"))
    converter = read(root / SECURITY.relative_to(ROOT) / "JwtAuthoritiesConverter.java")
    for fragment in ('.get("realm_access")', '.get("resource_access")', 'resourceAccess.get(resourceClientId)'):
        if fragment not in converter:
            findings.append(Finding("JWT_CLAIM_DRIFT", "JwtAuthoritiesConverter.java", f"expected claim boundary is absent: {fragment}"))
    if data.get("jwt", {}).get("accepted_claims") != policy["expected_claims"]:
        findings.append(Finding("JWT_CLAIM_DRIFT", "JwtAuthoritiesConverter.java", "accepted claim paths differ from policy"))
    if data.get("jwt", {}).get("unknown_role_policy") != "reject":
        findings.append(Finding("UNKNOWN_AUTHORITY_ACCEPTED", "JwtAuthoritiesConverter.java", "unknown role claims are converted into authorities"))
    worker = policy["worker"]
    if worker.get("user_authorities"):
        findings.append(Finding("WORKER_USER_AUTHORITY", "policy.json", "worker token grants user authorities"))
    if worker["token_header"] not in security_config or worker["route_prefix"] not in security_config:
        findings.append(Finding("WORKER_BOUNDARY_DRIFT", "SecurityConfig.java", "worker header or route boundary is absent"))
    dev = policy["dev_auth_disabled_contract"]
    if dev["required_guard"] not in security_config:
        findings.append(Finding("DEV_AUTH_CONTRACT_DRIFT", "SecurityConfig.java", "authentication-disabled mode is outside the dev contract"))
    return sorted(findings, key=lambda item: (item.code, item.location, item.detail))


def write_inventory(path: Path, data: dict[str, Any]) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--generate", action="store_true", help="write the deterministic inventory")
    parser.add_argument("--inventory", type=Path, default=DEFAULT_INVENTORY)
    args = parser.parse_args()
    data = inventory()
    if args.generate:
        write_inventory(args.inventory, data)
    policy = json.loads(read(POLICY))
    findings = validate(data, policy)
    payload = {"status": "PASS" if not findings else "FAIL", "findings": [asdict(item) for item in findings]}
    print(json.dumps(payload, ensure_ascii=False, sort_keys=True))
    return 0 if not findings else 1


if __name__ == "__main__":
    sys.exit(main())
