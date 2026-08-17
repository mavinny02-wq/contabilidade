#!/usr/bin/env python3
"""Parse and aggregate token outcome telemetry without provider access."""
from __future__ import annotations

import argparse
import hashlib
import json
from collections import defaultdict
from decimal import Decimal
from pathlib import Path
from typing import Any, Iterable

ORIGINS = {"PROVIDER_REPORTED", "LOCAL_ESTIMATE"}
CATEGORIES = {"HOT", "WARM", "COLD"}
TASK_CLASSES = {"DOCUMENTATION", "ANALYSIS", "IMPLEMENTATION", "VALIDATION", "RECONCILIATION"}
TOKEN_FIELDS = ("inputTokens", "outputTokens", "cachedTokens", "reasoningTokens")
SENSITIVE_KEYS = {"prompt", "response", "chainofthought", "chain_of_thought", "secret", "token", "password", "cookie", "authorization"}
REQUIRED = {"waveId", "item", "dispatchKey", "model", "executor", "inputTokens", "outputTokens", "origin", "category", "taskClass", "outcome", "classification", "timestamp"}
ALLOWED = REQUIRED | {"cachedTokens", "reasoningTokens", "cost", "fingerprint", "redactedFields", "contextFingerprint"}


class TelemetryError(ValueError):
    """Validation error with a stable, actionable code."""

    def __init__(self, code: str, path: str, message: str):
        super().__init__(f"{code} at {path}: {message}")
        self.code = code
        self.path = path


def _redact(value: Any, path: str = "$") -> tuple[Any, list[str]]:
    if isinstance(value, dict):
        clean: dict[str, Any] = {}
        redacted: list[str] = []
        for key, child in value.items():
            child_path = f"{path}.{key}"
            if key.lower() in SENSITIVE_KEYS:
                redacted.append(child_path)
                continue
            clean[key], child_redacted = _redact(child, child_path)
            redacted.extend(child_redacted)
        return clean, redacted
    if isinstance(value, list):
        clean_list, redacted = [], []
        for index, child in enumerate(value):
            clean_child, child_redacted = _redact(child, f"{path}[{index}]")
            clean_list.append(clean_child)
            redacted.extend(child_redacted)
        return clean_list, redacted
    return value, []


def _fingerprint(event: dict[str, Any]) -> str:
    material = {key: value for key, value in event.items() if key not in {"fingerprint", "redactedFields"}}
    encoded = json.dumps(material, ensure_ascii=True, separators=(",", ":"), sort_keys=True)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def parse_event(raw: Any, path: str = "$", *, redact: bool = True) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise TelemetryError("TOKEN_EVENT_TYPE", path, "expected an object")
    clean, redacted = _redact(raw)
    if redacted and not redact:
        raise TelemetryError("TOKEN_SENSITIVE_FIELD", redacted[0], "remove prompt, response, secret or credential data")
    unknown = sorted(set(clean) - ALLOWED)
    missing = sorted(REQUIRED - set(clean))
    if unknown:
        raise TelemetryError("TOKEN_UNKNOWN_FIELD", f"{path}.{unknown[0]}", "remove the unsupported field")
    if missing:
        raise TelemetryError("TOKEN_REQUIRED_FIELD", f"{path}.{missing[0]}", "add the required field")
    for field in REQUIRED - {"inputTokens", "outputTokens"}:
        if not isinstance(clean[field], str) or not clean[field]:
            raise TelemetryError("TOKEN_FIELD_TYPE", f"{path}.{field}", "expected a non-empty string")
    if clean["origin"] not in ORIGINS:
        raise TelemetryError("TOKEN_ORIGIN_INVALID", f"{path}.origin", "use PROVIDER_REPORTED or LOCAL_ESTIMATE")
    if clean["category"] not in CATEGORIES:
        raise TelemetryError("TOKEN_CATEGORY_INVALID", f"{path}.category", "use HOT, WARM or COLD")
    if clean["taskClass"] not in TASK_CLASSES:
        raise TelemetryError("TOKEN_TASK_CLASS_INVALID", f"{path}.taskClass", "use an explicit supported task class")
    for field in TOKEN_FIELDS:
        if field in clean and (isinstance(clean[field], bool) or not isinstance(clean[field], int) or clean[field] < 0):
            raise TelemetryError("TOKEN_COUNT_INVALID", f"{path}.{field}", "expected a non-negative integer")
    cost = clean.get("cost")
    if cost is not None:
        if not isinstance(cost, dict) or set(cost) - {"amount", "currency", "tableId"} or "amount" not in cost or "tableId" not in cost:
            raise TelemetryError("TOKEN_COST_INVALID", f"{path}.cost", "expected amount, tableId and optional currency")
        try:
            amount = Decimal(str(cost["amount"]))
        except Exception as exc:
            raise TelemetryError("TOKEN_COST_INVALID", f"{path}.cost.amount", "expected a non-negative decimal") from exc
        if amount < 0 or not isinstance(cost["tableId"], str) or not cost["tableId"]:
            raise TelemetryError("TOKEN_COST_INVALID", f"{path}.cost", "amount must be non-negative and tableId non-empty")
        cost["amount"] = str(amount)
    supplied = clean.pop("fingerprint", None)
    fingerprint = _fingerprint(clean)
    if supplied is not None and supplied != fingerprint:
        raise TelemetryError("TOKEN_FINGERPRINT_MISMATCH", f"{path}.fingerprint", "recompute the fingerprint from the canonical event")
    clean["fingerprint"] = fingerprint
    if redacted:
        clean["redactedFields"] = sorted(redacted)
    return clean


def read_events(path: Path) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    raw_events = json.loads(text) if path.suffix == ".json" else [json.loads(line) for line in text.splitlines() if line.strip()]
    if isinstance(raw_events, dict):
        raw_events = [raw_events]
    if not isinstance(raw_events, list):
        raise TelemetryError("TOKEN_INPUT_TYPE", "$", "expected an event, event array or JSONL")
    return [parse_event(event, f"$[{index}]") for index, event in enumerate(raw_events)]


def parse_policy(raw: Any, path: str = "$") -> dict[str, Any]:
    if not isinstance(raw, dict) or set(raw) != {"schemaVersion", "policyId", "classes"}:
        raise TelemetryError("TOKEN_POLICY_INVALID", path, "expected schemaVersion, policyId and classes")
    if raw["schemaVersion"] != "1.0" or not isinstance(raw["policyId"], str) or not raw["policyId"]:
        raise TelemetryError("TOKEN_POLICY_INVALID", path, "use schemaVersion 1.0 and a non-empty policyId")
    if not isinstance(raw["classes"], dict):
        raise TelemetryError("TOKEN_POLICY_INVALID", f"{path}.classes", "expected an object keyed by task class")
    expected = {"inputTokens", "outputTokens", "totalTokens", "cost"}
    for task_class, limits in raw["classes"].items():
        if task_class not in TASK_CLASSES or not isinstance(limits, dict) or set(limits) != expected:
            raise TelemetryError("TOKEN_POLICY_INVALID", f"{path}.classes.{task_class}", "expected the four budget dimensions")
        for dimension in ("inputTokens", "outputTokens", "totalTokens"):
            value = limits[dimension]
            if not isinstance(value, dict) or set(value) != {"warning", "hard"} or not all(isinstance(value[k], int) and not isinstance(value[k], bool) and value[k] >= 0 for k in value) or value["warning"] > value["hard"]:
                raise TelemetryError("TOKEN_POLICY_INVALID", f"{path}.classes.{task_class}.{dimension}", "expected integer warning <= hard")
        cost = limits["cost"]
        if not isinstance(cost, dict) or set(cost) != {"warning", "hard", "currency"}:
            raise TelemetryError("TOKEN_POLICY_INVALID", f"{path}.classes.{task_class}.cost", "expected warning, hard and currency")
        try:
            warning, hard = Decimal(str(cost["warning"])), Decimal(str(cost["hard"]))
        except Exception as exc:
            raise TelemetryError("TOKEN_POLICY_INVALID", f"{path}.classes.{task_class}.cost", "expected decimal limits") from exc
        if warning < 0 or warning > hard or not isinstance(cost["currency"], str) or not cost["currency"]:
            raise TelemetryError("TOKEN_POLICY_INVALID", f"{path}.classes.{task_class}.cost", "expected non-negative warning <= hard and currency")
    return raw


def _budget_result(event: dict[str, Any], policy: dict[str, Any] | None) -> dict[str, Any]:
    result = {"item": event["item"], "fingerprint": event["fingerprint"], "taskClass": event["taskClass"]}
    if policy is None or event["taskClass"] not in policy["classes"]:
        return {**result, "status": "BUDGET_POLICY_MISSING", "deviations": []}
    limits = policy["classes"][event["taskClass"]]
    actual: dict[str, Any] = {"inputTokens": event["inputTokens"], "outputTokens": event["outputTokens"],
                              "totalTokens": sum(event.get(field, 0) for field in TOKEN_FIELDS)}
    if event.get("cost"):
        currency = event["cost"].get("currency")
        if not currency or currency != limits["cost"]["currency"]:
            return {**result, "status": "BUDGET_POLICY_MISSING", "deviations": [{"dimension": "cost", "reason": "CURRENCY_POLICY_MISSING"}]}
        actual["cost"] = Decimal(event["cost"]["amount"])
    deviations = []
    status = "WITHIN_BUDGET"
    for dimension, value in actual.items():
        limit = limits[dimension]
        warning, hard = Decimal(str(limit["warning"])), Decimal(str(limit["hard"]))
        numeric = Decimal(str(value))
        if numeric > hard:
            level, status = "BREACH", "BUDGET_BREACH"
        elif numeric >= warning:
            level = "WARNING"
            if status != "BUDGET_BREACH": status = "BUDGET_WARNING"
        else:
            continue
        deviations.append({"dimension": dimension, "level": level, "actual": str(value), "warning": str(limit["warning"]), "hard": str(limit["hard"]), "overHard": str(max(Decimal(0), numeric - hard))})
    return {**result, "status": status, "deviations": deviations}


def aggregate(events: Iterable[dict[str, Any]], policy: dict[str, Any] | None = None) -> dict[str, Any]:
    event_list = list(events)
    seen: set[str] = set()
    dimensions: dict[tuple[str, str, str, str, str, str], dict[str, Any]] = {}
    contexts: defaultdict[str, list[str]] = defaultdict(list)
    costs: defaultdict[tuple[str, str], Decimal] = defaultdict(Decimal)
    unknown_costs: defaultdict[str, int] = defaultdict(int)
    budget_usage: defaultdict[str, int] = defaultdict(int)
    for event in event_list:
        fingerprint = event["fingerprint"]
        if fingerprint in seen:
            raise TelemetryError("TOKEN_DUPLICATE_FINGERPRINT", "$.fingerprint", f"duplicate {fingerprint}")
        seen.add(fingerprint)
        key = (event["waveId"], event["item"], event["model"], event["category"], event["outcome"], event["origin"])
        row = dimensions.setdefault(key, {"eventCount": 0, **{field: 0 for field in TOKEN_FIELDS}})
        row["eventCount"] += 1
        for field in TOKEN_FIELDS:
            row[field] += event.get(field, 0)
        total = sum(event.get(field, 0) for field in TOKEN_FIELDS)
        budget_usage[event["item"]] += total
        if event.get("contextFingerprint"):
            contexts[event["contextFingerprint"]].append(event["fingerprint"])
        if event.get("cost"):
            currency = event["cost"].get("currency")
            if currency:
                costs[(event["outcome"], currency)] += Decimal(event["cost"]["amount"])
            else:
                unknown_costs[event["outcome"]] += 1
    rows = []
    for key in sorted(dimensions):
        values = dimensions[key]
        rows.append(dict(zip(("waveId", "item", "model", "category", "outcome", "origin"), key), **values))
    budget_results = [_budget_result(event, policy) for event in sorted(event_list, key=lambda value: value["fingerprint"])]
    top = sorted(({"item": item, "tokens": used} for item, used in budget_usage.items()), key=lambda row: (-row["tokens"], row["item"]))
    deviations = [{"item": row["item"], "fingerprint": row["fingerprint"], **deviation} for row in budget_results for deviation in row["deviations"]]
    deviations.sort(key=lambda row: (-Decimal(row.get("overHard", "0")), row["item"], row["dimension"], row["fingerprint"]))
    return {"schemaVersion": "3.0", "policyId": policy["policyId"] if policy else None, "eventCount": len(seen), "aggregates": rows,
            "costPerOutcome": [{"outcome": outcome, "currency": currency, "amount": str(amount)} for (outcome, currency), amount in sorted(costs.items())],
            "unknownCostEvents": [{"outcome": outcome, "count": count} for outcome, count in sorted(unknown_costs.items())],
            "budgetResults": budget_results, "topDeviations": deviations[:10], "topConsumers": top,
            "duplicateContexts": [{"contextFingerprint": digest, "eventFingerprints": sorted(values)} for digest, values in sorted(contexts.items()) if len(values) > 1]}


def markdown_summary(report: dict[str, Any]) -> str:
    breaches = sum(row["status"] == "BUDGET_BREACH" for row in report["budgetResults"])
    lines = ["# Token outcome telemetry", "", f"- Events: {report['eventCount']}", f"- Policy: {report['policyId'] or 'MISSING'}", f"- Budget breaches: {breaches}", "", "## Top consumers", "", "| Item | Tokens |", "|---|---:|"]
    lines.extend(f"| {row['item']} | {row['tokens']} |" for row in report["topConsumers"])
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("events", type=Path)
    parser.add_argument("--policy", type=Path, help="versioned task-class budget policy")
    parser.add_argument("--json-output", type=Path)
    parser.add_argument("--markdown-output", type=Path)
    args = parser.parse_args()
    try:
        policy = parse_policy(json.loads(args.policy.read_text(encoding="utf-8"))) if args.policy else None
        report = aggregate(read_events(args.events), policy)
    except (OSError, json.JSONDecodeError, TelemetryError) as exc:
        parser.exit(2, f"TOKEN_TELEMETRY_ERROR: {exc}\n")
    output = json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if args.json_output:
        args.json_output.write_text(output, encoding="utf-8")
    else:
        print(output, end="")
    if args.markdown_output:
        args.markdown_output.write_text(markdown_summary(report), encoding="utf-8")
    return 3 if any(row["status"] == "BUDGET_BREACH" for row in report["budgetResults"]) else 0


if __name__ == "__main__":
    raise SystemExit(main())
