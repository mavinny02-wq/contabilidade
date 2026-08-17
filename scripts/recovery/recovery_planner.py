#!/usr/bin/env python3
"""Build a deterministic, offline recovery rehearsal plan; never perform recovery."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
POLICY_PATH = ROOT / "recovery-policy.v1.json"
SHA256 = re.compile(r"^[0-9a-f]{64}$")
LOGICAL_PATH = re.compile(r"^[a-z][a-z0-9_-]*\.[a-z0-9]+$")
FRONTIER = re.compile(r"^[0-9]+(?:\.[0-9]+)*$")
REQUIRED_STEPS = [
    "verify_backup_set", "provision_empty_target", "restore_database",
    "validate_flyway_frontier", "restore_documents", "reconcile_storage",
    "run_recovery_checks",
]


class PlanError(ValueError):
    """Safe, non-sensitive validation finding."""


def canonical_manifest_hash(manifest: dict[str, Any]) -> str:
    payload = {key: value for key, value in manifest.items() if key != "manifestSha256"}
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()
    return hashlib.sha256(encoded).hexdigest()


def parse_time(value: str, field: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (TypeError, ValueError) as exc:
        raise PlanError(f"{field}: timestamp inválido") from exc
    if parsed.tzinfo is None:
        raise PlanError(f"{field}: timezone obrigatória")
    return parsed.astimezone(timezone.utc)


def validate_manifest(manifest: dict[str, Any]) -> None:
    required = {"backupSetId", "createdAt", "applicationVersion", "gitCommit", "flywayFrontier",
                "databaseDump", "documentsArchive", "manifestSha256", "encryptionMetadata"}
    if set(manifest) != required:
        raise PlanError("manifest: campos ausentes ou desconhecidos")
    if not re.fullmatch(r"synthetic-[a-z0-9-]+", str(manifest["backupSetId"])):
        raise PlanError("backupSetId: somente identificador sintético é aceito")
    parse_time(manifest["createdAt"], "createdAt")
    if not FRONTIER.fullmatch(str(manifest["flywayFrontier"])):
        raise PlanError("flywayFrontier: formato inválido")
    seen: set[str] = set()
    for name in ("databaseDump", "documentsArchive"):
        component = manifest.get(name)
        if not isinstance(component, dict) or set(component) != {"path", "size", "sha256"}:
            raise PlanError(f"{name}: componente incompleto")
        path = component["path"]
        if not isinstance(path, str) or not LOGICAL_PATH.fullmatch(path):
            raise PlanError(f"{name}: path lógico inválido")
        if path in seen:
            raise PlanError("manifest: componente duplicado")
        seen.add(path)
        if not isinstance(component["size"], int) or isinstance(component["size"], bool) or component["size"] <= 0:
            raise PlanError(f"{name}: tamanho inválido")
        if not isinstance(component["sha256"], str) or not SHA256.fullmatch(component["sha256"]):
            raise PlanError(f"{name}: checksum inválido")
    encryption = manifest["encryptionMetadata"]
    if not isinstance(encryption, dict) or set(encryption) != {"algorithm", "keyReferencePresent"}:
        raise PlanError("encryptionMetadata: contrato inválido")
    if not encryption["algorithm"] or encryption["keyReferencePresent"] is not False:
        raise PlanError("encryptionMetadata: chave ou referência de chave é proibida")
    expected = canonical_manifest_hash(manifest)
    if manifest["manifestSha256"] != expected:
        raise PlanError("manifest: checksum divergente")


def validate_policy(policy: dict[str, Any]) -> None:
    if policy.get("requiredSteps") != REQUIRED_STEPS:
        raise PlanError("policy: ordem de recovery inválida")
    if policy.get("allowedTargetKinds") != ["ephemeral"]:
        raise PlanError("policy: target permitido inválido")
    if not isinstance(policy.get("maximumRpoSeconds"), int) or policy["maximumRpoSeconds"] <= 0:
        raise PlanError("policy: RPO máximo inválido")


def build_plan(manifest: dict[str, Any], target: dict[str, Any], reference_at: str,
               expected_frontier: str, policy: dict[str, Any]) -> dict[str, Any]:
    validate_policy(policy)
    validate_manifest(manifest)
    if set(target) != {"targetId", "kind", "production", "empty"}:
        raise PlanError("target: contrato incompleto")
    if target["kind"] not in policy["allowedTargetKinds"] or target["production"] is not False:
        raise PlanError("target: deve ser explicitamente efêmero e não produtivo")
    if target["empty"] is not True:
        raise PlanError("target: deve estar declarado vazio")
    if manifest["flywayFrontier"] != expected_frontier:
        raise PlanError("flywayFrontier: incompatível com o alvo declarado")
    created = parse_time(manifest["createdAt"], "createdAt")
    reference = parse_time(reference_at, "referenceAt")
    rpo = int((reference - created).total_seconds())
    if rpo < 0:
        raise PlanError("RPO: referência anterior ao backup")
    if rpo > policy["maximumRpoSeconds"]:
        raise PlanError("RPO: backup excede a política de antiguidade")
    steps = policy["requiredSteps"]
    return {
        "contractVersion": "1.0",
        "mode": "OFFLINE_PLAN_ONLY",
        "backupSetId": manifest["backupSetId"],
        "target": target,
        "flywayFrontier": expected_frontier,
        "rpo": {"referenceAt": reference_at, "backupCreatedAt": manifest["createdAt"], "seconds": rpo},
        "rto": {"status": "TO_BE_MEASURED", "startEvent": "rehearsal_started", "endEvent": "checks_completed"},
        "steps": [{"order": index, "action": action} for index, action in enumerate(steps, 1)],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--target", required=True, type=Path)
    parser.add_argument("--reference-at", required=True)
    parser.add_argument("--expected-frontier", required=True)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
        target = json.loads(args.target.read_text(encoding="utf-8"))
        policy = json.loads(POLICY_PATH.read_text(encoding="utf-8"))
        plan = build_plan(manifest, target, args.reference_at, args.expected_frontier, policy)
        args.output.write_text(json.dumps(plan, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    except (OSError, json.JSONDecodeError, PlanError) as exc:
        print(f"RECOVERY_PLAN_REJECTED: {exc}", file=sys.stderr)
        return 2
    print("RECOVERY_PLAN_CREATED: offline plan only")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
