#!/usr/bin/env python3
"""Local-first idempotency guard for wave owner dispatches."""
from __future__ import annotations

import argparse
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

from validate_wave_manifests import DISPATCH_KEY, dispatch_key

BLOCKING_STATUSES = {"ACTIVE", "INTEGRATED", "CONSUMED", "SUPERSEDED_DUPLICATE_OWNER"}


def load_registry(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or data.get("schemaVersion") != "1.0" or not isinstance(data.get("dispatches"), dict):
        raise ValueError(f"REGISTRY_INVALID {path}: expected schemaVersion 1.0 and a dispatches object")
    return data["dispatches"]


def save_registry(path: Path, entries: dict[str, dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps({"schemaVersion": "1.0", "dispatches": entries}, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    temporary.replace(path)


def github_occurrences(key: str, repository: str | None, token: str | None) -> tuple[str, int]:
    if not repository or not token:
        return "GITHUB_UNAVAILABLE: set GITHUB_REPOSITORY and GITHUB_TOKEN for remote audit", 0
    request = urllib.request.Request(
        f"https://api.github.com/search/issues?q={key}+repo:{repository}",
        headers={"Accept": "application/vnd.github+json", "Authorization": f"Bearer {token}", "User-Agent": "contabilidade-dispatch-guard"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return "GITHUB_CHECKED", int(json.load(response).get("total_count", 0))
    except (OSError, urllib.error.HTTPError, ValueError) as exc:
        return f"GITHUB_UNAVAILABLE: {type(exc).__name__}", 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--wave", required=True)
    parser.add_argument("--item", required=True)
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--registry", type=Path, default=Path(".contabilidade-orchestrator/dispatch-registry.json"))
    parser.add_argument("--register", action="store_true", help="atomically record an accepted dispatch as ACTIVE")
    parser.add_argument("--key", help="assert the key copied from manifest/launcher/result")
    parser.add_argument("--result", type=Path, help="require the result Markdown to expose this DISPATCH_KEY")
    parser.add_argument("--github-aware", action="store_true")
    args = parser.parse_args()
    key = dispatch_key(args.wave, args.item, args.baseline)
    if args.key and (not DISPATCH_KEY.fullmatch(args.key) or args.key != key):
        print(f"ERROR DISPATCH_KEY_MISMATCH: expected {key}; regenerate from wave + item + baseline")
        return 2
    if args.result:
        try:
            result_text = args.result.read_text(encoding="utf-8")
        except OSError as exc:
            print(f"ERROR RESULT_UNREADABLE {args.result}: {exc}")
            return 2
        if f"DISPATCH_KEY: {key}" not in result_text and f"`{key}`" not in result_text:
            print(f"ERROR RESULT_DISPATCH_KEY_MISSING {args.result}: add DISPATCH_KEY: {key}")
            return 2
    try:
        entries = load_registry(args.registry)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR {exc}")
        return 2
    existing = entries.get(key)
    if existing and existing.get("status") in BLOCKING_STATUSES:
        previous_status = existing.get("status", "UNKNOWN")
        existing["previousStatus"] = previous_status
        existing["status"] = "SUPERSEDED_DUPLICATE_OWNER"
        save_registry(args.registry, entries)
        print(f"ERROR DUPLICATE_DISPATCH {key}: already {previous_status}; attempt marked SUPERSEDED_DUPLICATE_OWNER")
        return 1
    if args.github_aware:
        classification, count = github_occurrences(key, os.getenv("GITHUB_REPOSITORY"), os.getenv("GITHUB_TOKEN"))
        print(classification)
        if count:
            print(f"ERROR GITHUB_DUPLICATE_DISPATCH {key}: found in {count} issue(s)/PR(s)")
            return 1
    if args.register:
        entries[key] = {"waveId": args.wave, "item": args.item, "baselineCommit": args.baseline, "status": "ACTIVE"}
        save_registry(args.registry, entries)
    print(f"DISPATCH_ALLOWED {key}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
