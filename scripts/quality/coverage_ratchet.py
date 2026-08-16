#!/usr/bin/env python3
"""Validate component coverage measurements and enforce the checked-in ratchet."""

from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path

METRICS = {"lines", "branches", "functions", "statements"}


def load(path: Path) -> dict:
    if not path.is_file() or path.stat().st_size == 0:
        raise ValueError(f"missing or empty report: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def validate(document: dict) -> None:
    if document.get("schemaVersion") != 1 or not document.get("baselineSha"):
        raise ValueError("invalid coverage contract header")
    components = document.get("components")
    if not isinstance(components, list) or not components:
        raise ValueError("coverage contract has no components")
    names: set[str] = set()
    for component in components:
        name = component.get("component")
        if not name or name in names:
            raise ValueError("component names must be present and unique")
        names.add(name)
        completeness = component.get("completeness")
        limitations = component.get("limitations", [])
        if completeness not in {"COMPLETE", "PARTIAL"}:
            raise ValueError(f"{name}: invalid completeness")
        if completeness == "PARTIAL" and not limitations:
            raise ValueError(f"{name}: PARTIAL requires a limitation")
        if completeness == "COMPLETE" and limitations:
            raise ValueError(f"{name}: COMPLETE cannot carry limitations")
        if not component.get("command") or not component.get("toolchain"):
            raise ValueError(f"{name}: command and toolchain are required")
        metrics = component.get("metrics")
        if not isinstance(metrics, dict) or not metrics:
            raise ValueError(f"{name}: metrics are required")
        for metric, value in metrics.items():
            if metric not in METRICS or set(value) != {"covered", "total", "percent"}:
                raise ValueError(f"{name}/{metric}: invalid metric")
            covered, total, percent = value["covered"], value["total"], value["percent"]
            if not isinstance(covered, int) or not isinstance(total, int) or total <= 0:
                raise ValueError(f"{name}/{metric}: invalid denominator")
            expected = round(covered * 100 / total, 4)
            if covered < 0 or covered > total or abs(percent - expected) > 0.0001:
                raise ValueError(f"{name}/{metric}: inconsistent percentage")


def compare(baseline: dict, current: dict, today: date) -> list[str]:
    validate(baseline)
    validate(current)
    current_by_name = {item["component"]: item for item in current["components"]}
    failures: list[str] = []
    exceptions = baseline.get("exceptions", [])
    for exception in exceptions:
        required = {"owner", "reason", "scope", "expires"}
        if set(exception) != required:
            failures.append("exception is missing owner, reason, scope, or expires")
        elif date.fromisoformat(exception["expires"]) < today:
            failures.append(f"expired exception: {exception['scope']}")
    tolerance = baseline.get("tolerance", {}).get("percentagePoints")
    if not isinstance(tolerance, (int, float)) or tolerance < 0:
        raise ValueError("non-negative percentage-point tolerance is required")
    for old in baseline["components"]:
        new = current_by_name.get(old["component"])
        if new is None:
            failures.append(f"missing component: {old['component']}")
            continue
        for metric, old_value in old["metrics"].items():
            new_value = new["metrics"].get(metric)
            if new_value is None:
                failures.append(f"missing metric: {old['component']}/{metric}")
            elif new_value["percent"] + tolerance < old_value["percent"]:
                failures.append(
                    f"coverage drop: {old['component']}/{metric} "
                    f"{old_value['percent']} -> {new_value['percent']}"
                )
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", type=Path, required=True)
    parser.add_argument("--current", type=Path)
    args = parser.parse_args()
    try:
        baseline = load(args.baseline)
        validate(baseline)
        failures = compare(baseline, load(args.current), date.today()) if args.current else []
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"COVERAGE_RATCHET_INVALID: {error}")
        return 2
    if failures:
        print("COVERAGE_RATCHET_FAILED: " + "; ".join(failures))
        return 1
    print("COVERAGE_RATCHET_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
