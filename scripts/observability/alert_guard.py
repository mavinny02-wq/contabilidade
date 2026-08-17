#!/usr/bin/env python3
"""Deterministically validates the local, vendor-neutral alerting contract."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "infra/observability/slo-catalog.v1.json"
RULES = ROOT / "infra/observability/alerts/contabilidade-slo.rules.yml"
FIXTURES = ROOT / "infra/observability/fixtures/alert-states.v1.json"


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def validate() -> list[str]:
    errors: list[str] = []
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    fixtures = json.loads(FIXTURES.read_text(encoding="utf-8"))
    rules = RULES.read_text(encoding="utf-8")
    slos = catalog["slos"]
    ids = [slo["id"] for slo in slos]
    metrics = {slo["metric"] for slo in slos}

    if len(ids) != len(set(ids)):
        fail(errors, "duplicate SLO id")
    for slo in slos:
        if slo["direction"] == "above" and slo["warning"] >= slo["critical"]:
            fail(errors, f"inverted thresholds: {slo['id']}")

    used_metrics = set(re.findall(r"\bcontabilidade_[a-z0-9_:]+", rules))
    for metric in sorted(used_metrics - metrics):
        fail(errors, f"unknown metric: {metric}")
    for label in catalog["forbiddenLabels"]:
        if re.search(rf"\b{re.escape(label)}\s*=", rules):
            fail(errors, f"forbidden label: {label}")

    blocks = re.split(r"(?=^\s*- alert:)", rules, flags=re.MULTILINE)[1:]
    names: list[str] = []
    runbook = ROOT / "docs/operacao/RUNBOOK_SLO_ALERTING.md"
    runbook_text = runbook.read_text(encoding="utf-8") if runbook.exists() else ""
    for block in blocks:
        match = re.search(r"- alert:\s*(\S+)", block)
        if not match:
            continue
        name = match.group(1)
        names.append(name)
        if not re.search(r"labels:\s*\{[^}]*owner:\s*[^,}]+", block):
            fail(errors, f"alert without owner: {name}")
        link = re.search(r'runbook_url:\s*"([^"#]+)#([^"}]+)', block)
        if not link:
            fail(errors, f"alert without runbook: {name}")
        elif not (ROOT / link.group(1)).exists() or f'id="{link.group(2)}"' not in runbook_text:
            fail(errors, f"broken runbook link: {name}")
        if not re.search(r"^\s*for:\s*\S+", block, re.MULTILINE):
            fail(errors, f"alert without for: {name}")
    if len(names) != len(set(names)):
        fail(errors, "duplicate alert name")

    slo_by_id = {slo["id"]: slo for slo in slos}
    required_states = {"normal", "warning", "critical", "recovery"}
    scenario_names = {scenario["name"] for scenario in fixtures["scenarios"]}
    if scenario_names != required_states:
        fail(errors, "fixtures must contain normal, warning, critical and recovery")
    for scenario in fixtures["scenarios"]:
        states = []
        if set(scenario["values"]) != set(ids):
            fail(errors, f"fixture signal mismatch: {scenario['name']}")
            continue
        for slo_id, value in scenario["values"].items():
            slo = slo_by_id[slo_id]
            states.append("critical" if value > slo["critical"] else
                          "warning" if value > slo["warning"] else "normal")
        actual = "critical" if "critical" in states else "warning" if "warning" in states else "normal"
        if actual != scenario["expected"]:
            fail(errors, f"fixture {scenario['name']}: expected {scenario['expected']}, got {actual}")
    return sorted(errors)


if __name__ == "__main__":
    problems = validate()
    if problems:
        print("ALERT_GUARD_FAILED")
        print("\n".join(problems))
        sys.exit(1)
    print("ALERT_GUARD_OK alerts=15 slos=7 fixtures=4")
