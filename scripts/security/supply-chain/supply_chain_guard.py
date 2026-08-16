#!/usr/bin/env python3
"""Deterministic enforcement for normalized scanner output; never prints raw evidence."""

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def validate_exceptions(items, required, today):
    valid = {}
    errors = []
    for item in items:
        missing = sorted(set(required) - set(item))
        label = str(item.get("id", "unnamed"))
        if missing:
            errors.append({"exception": label, "error": "missing-fields", "fields": missing})
            continue
        try:
            expires = dt.date.fromisoformat(item["expires"])
        except (TypeError, ValueError):
            errors.append({"exception": label, "error": "invalid-expiry"})
            continue
        if expires < today:
            errors.append({"exception": label, "error": "expired"})
            continue
        valid[(item["rule"], item["resource"])] = label
    return valid, errors


def sanitize(value, redacted):
    if isinstance(value, dict):
        return {k: "[REDACTED]" if k.lower() in redacted else sanitize(v, redacted) for k, v in value.items()}
    if isinstance(value, list):
        return [sanitize(v, redacted) for v in value]
    return value


def evaluate(policy, exceptions, evidence, today):
    valid, errors = validate_exceptions(
        exceptions.get("exceptions", []), policy["exception_required_fields"], today
    )
    blocked, accepted = [], []
    fail_levels = set(policy["fail_severities"])
    for finding in evidence.get("findings", []):
        safe = sanitize(finding, set(policy["redact_fields"]))
        safe.pop("description", None)
        safe["fingerprint"] = hashlib.sha256(
            (str(finding.get("rule")) + "\0" + str(finding.get("resource"))).encode()
        ).hexdigest()[:16]
        exception = valid.get((finding.get("rule"), finding.get("resource")))
        if exception:
            safe["exception"] = exception
            accepted.append(safe)
        elif finding.get("severity") in fail_levels:
            blocked.append(safe)
    limitation = evidence.get("scanner_status") in {"feed-unavailable", "image-unavailable"}
    status = "environment-limitation" if limitation else "fail" if errors or blocked else "pass"
    return {"status": status, "blocked": blocked, "excepted": accepted, "exception_errors": errors}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--policy", required=True)
    parser.add_argument("--exceptions", required=True)
    parser.add_argument("--evidence", required=True)
    parser.add_argument("--today", type=dt.date.fromisoformat, default=dt.date.today())
    args = parser.parse_args()
    report = evaluate(load(args.policy), load(args.exceptions), load(args.evidence), args.today)
    print(json.dumps(report, sort_keys=True))
    return 0 if report["status"] == "pass" else 2 if report["status"] == "environment-limitation" else 1


if __name__ == "__main__":
    sys.exit(main())
