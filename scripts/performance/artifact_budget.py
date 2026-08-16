#!/usr/bin/env python3
"""Measure build artifacts and enforce repository-owned size budgets."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import platform
import subprocess
import sys
import zipfile
from datetime import date
from pathlib import Path


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def command_version(command: list[str]) -> str:
    try:
        result = subprocess.run(command, check=True, text=True, capture_output=True)
        return (result.stdout or result.stderr).splitlines()[0].strip()
    except (OSError, subprocess.CalledProcessError):
        return "unavailable"


def files_under(root: Path) -> list[Path]:
    return sorted(path for path in root.rglob("*") if path.is_file()) if root.is_dir() else []


def require_files(files: list[Path], label: str) -> None:
    if not files:
        raise ValueError(f"missing or empty artifact: {label}")


def measure_backend(jar: Path) -> dict:
    if not jar.is_file() or jar.stat().st_size == 0:
        raise ValueError(f"missing or empty artifact: {jar.name}")
    with zipfile.ZipFile(jar) as archive:
        entries = [item for item in archive.infolist() if not item.is_dir()]
        largest = sorted(entries, key=lambda item: item.file_size, reverse=True)[:10]
    return {
        "jar_bytes": jar.stat().st_size,
        "entry_count": len(entries),
        "largest_entry_bytes": largest[0].file_size if largest else 0,
        "largest_entries": [{"name": item.filename, "bytes": item.file_size} for item in largest],
        "sha256": sha256(jar),
    }


def measure_frontend(dist: Path) -> dict:
    files = files_under(dist)
    require_files(files, "frontend dist")
    js = [path for path in files if path.suffix == ".js"]
    css = [path for path in files if path.suffix == ".css"]
    return {
        "total_bytes": sum(path.stat().st_size for path in files),
        "file_count": len(files),
        "asset_count": len([path for path in files if "assets" in path.parts]),
        "js_chunk_count": len(js),
        "largest_js_bytes": max((path.stat().st_size for path in js), default=0),
        "largest_js_gzip_bytes": max((len(gzip.compress(path.read_bytes(), mtime=0)) for path in js), default=0),
        "css_bytes": sum(path.stat().st_size for path in css),
        "css_gzip_bytes": sum(len(gzip.compress(path.read_bytes(), mtime=0)) for path in css),
    }


def measure_worker(dist: Path) -> dict:
    files = files_under(dist)
    require_files(files, "worker dist")
    sizes = [path.stat().st_size for path in files]
    return {
        "total_bytes": sum(sizes),
        "own_code_bytes": sum(sizes),
        "file_count": len(files),
        "largest_file_bytes": max(sizes),
    }


def write_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def measure(args: argparse.Namespace) -> None:
    root = Path(args.root).resolve()
    report = {
        "schema_version": 1,
        "source_sha": args.source_sha,
        "toolchain": {
            "os": platform.system(),
            "java": command_version(["java", "-version"]),
            "maven": command_version(["mvn", "-version"]),
            "node": command_version(["node", "--version"]),
            "npm": command_version(["npm", "--version"]),
        },
        "components": {
            "backend": {"command": "cd backend && mvn -DskipTests package", "metrics": measure_backend(root / args.backend_jar)},
            "frontend": {"command": "cd frontend && npm run build", "metrics": measure_frontend(root / args.frontend_dist)},
            "worker": {"command": "cd automation-worker && npm run build", "metrics": measure_worker(root / args.worker_dist)},
        },
        "scope": "artifact size only; this report makes no runtime, latency, or throughput claim",
    }
    write_json(Path(args.output), report)


def exception_active(exception: dict, component: str, metric: str, today: date) -> bool:
    required = all(exception.get(field) for field in ("owner", "reason", "expires"))
    return required and exception.get("component") == component and exception.get("metric") == metric and date.fromisoformat(exception["expires"]) >= today


def guard(args: argparse.Namespace) -> None:
    policy = json.loads(Path(args.policy).read_text(encoding="utf-8"))
    current = json.loads(Path(args.current).read_text(encoding="utf-8"))
    failures = []
    components = current.get("components") or {}
    for component in sorted(set(components) - set(policy["components"])):
        failures.append(f"{component}: component has no baseline")
    for component, configured in policy["components"].items():
        metrics = (components.get(component) or {}).get("metrics") or {}
        if not metrics:
            failures.append(f"{component}: missing measurement")
            continue
        for metric, budget in configured["metrics"].items():
            value = metrics.get(metric)
            if not isinstance(value, (int, float)):
                failures.append(f"{component}.{metric}: missing numeric measurement")
                continue
            baseline = budget["baseline"]
            allowed = baseline + max(budget.get("tolerance", 0), baseline * budget.get("max_growth_ratio", 0))
            if value > allowed and not any(exception_active(item, component, metric, date.today()) for item in policy.get("exceptions", [])):
                failures.append(f"{component}.{metric}: {value} exceeds {allowed:g} (baseline {baseline})")
    if failures:
        raise ValueError("budget check failed:\n" + "\n".join(failures))
    print("artifact budgets: PASS")


def reproducible(args: argparse.Namespace) -> None:
    first = json.loads(Path(args.first).read_text(encoding="utf-8"))
    second = json.loads(Path(args.second).read_text(encoding="utf-8"))
    differences = []
    for component, value in first.get("components", {}).items():
        other = second.get("components", {}).get(component)
        if other is None:
            differences.append(f"{component}: missing second measurement")
        else:
            first_metrics = {key: item for key, item in value.get("metrics", {}).items() if key not in ("sha256", "largest_entries")}
            second_metrics = {key: item for key, item in other.get("metrics", {}).items() if key not in ("sha256", "largest_entries")}
            if first_metrics != second_metrics:
                differences.append(f"{component}: metrics differ")
    if differences:
        raise ValueError("non-reproducible measurements:\n" + "\n".join(differences))
    print("artifact measurements: REPRODUCIBLE")


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    sub = result.add_subparsers(dest="command", required=True)
    collect = sub.add_parser("measure")
    collect.add_argument("--root", default=".")
    collect.add_argument("--backend-jar", default="backend/target/contabilidade-backend.jar")
    collect.add_argument("--frontend-dist", default="frontend/dist")
    collect.add_argument("--worker-dist", default="automation-worker/dist")
    collect.add_argument("--source-sha", required=True)
    collect.add_argument("--output", required=True)
    collect.set_defaults(run=measure)
    check = sub.add_parser("guard")
    check.add_argument("--policy", required=True)
    check.add_argument("--current", required=True)
    check.set_defaults(run=guard)
    repeat = sub.add_parser("reproducible")
    repeat.add_argument("--first", required=True)
    repeat.add_argument("--second", required=True)
    repeat.set_defaults(run=reproducible)
    return result


if __name__ == "__main__":
    try:
        arguments = parser().parse_args()
        arguments.run(arguments)
    except (OSError, ValueError, KeyError, json.JSONDecodeError, zipfile.BadZipFile) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
