#!/usr/bin/env python3
"""Scan Git-tracked text without ever emitting matched values."""

import argparse
import datetime as dt
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath

RULES = {
    "private-key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "certificate": re.compile(r"-----BEGIN CERTIFICATE-----"),
    "bearer-token": re.compile(r"(?i)\bbearer\s+[A-Za-z0-9._~+/=-]{16,}"),
    "jwt": re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b"),
    "credential-dsn": re.compile(r"(?i)\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?)://[^\s:/]+:[^\s/@]+@"),
    "token-prefix": re.compile(r"\b(?:gh[opusr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})\b"),
    "sensitive-assignment": re.compile(r"(?i)\b(?:password|passwd|secret|api[_-]?key|access[_-]?token)\s*[:=]\s*['\"]?(?!\$\{|\{\{|<|REDACTED|CHANGE[-_]ME|EXAMPLE|DUMMY|TEST)(?=[A-Za-z0-9_./+@=-]*\d)[A-Za-z0-9_./+@=-]{12,}"),
    "cpf": re.compile(r"(?<!\d)\d{3}\.\d{3}\.\d{3}-\d{2}(?!\d)"),
}


def fingerprint(rule, value):
    return hashlib.sha256((rule + "\0" + value).encode()).hexdigest()[:16]


def excluded(path, patterns):
    return any(PurePosixPath(path).match(pattern) for pattern in patterns)


def tracked_files(root):
    result = subprocess.run(
        ["git", "-C", str(root), "ls-files", "-z"], check=True, capture_output=True
    )
    return [item.decode("utf-8", "surrogateescape") for item in result.stdout.split(b"\0") if item]


def scan(root, policy):
    today = dt.date.today()
    exceptions = {(e["path"], e["rule"], e["fingerprint"]): e for e in policy.get("exceptions", [])}
    findings, expired = [], []
    for path in tracked_files(root):
        if excluded(path, policy.get("exclude_paths", [])):
            continue
        data = (root / path).read_bytes()
        if b"\0" in data:
            continue
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            continue
        for line_no, line in enumerate(text.splitlines(), 1):
            for rule, regex in RULES.items():
                for match in regex.finditer(line):
                    fp = fingerprint(rule, match.group(0))
                    exception = exceptions.get((path, rule, fp))
                    if exception:
                        if dt.date.fromisoformat(exception["expires"]) < today:
                            expired.append({"file": path, "line": line_no, "rule": rule, "fingerprint": fp})
                        continue
                    findings.append({"file": path, "line": line_no, "rule": rule, "fingerprint": fp})
    return findings, expired


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--policy", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    root = args.root.resolve()
    policy_path = args.policy or Path(__file__).with_name("secret_pii_policy.json")
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    findings, expired = scan(root, policy)
    report = {"status": "fail" if findings or expired else "pass", "findings": findings, "expired_exceptions": expired}
    if args.json:
        print(json.dumps(report, sort_keys=True))
    else:
        print("secret/PII guard: " + report["status"])
        for item in findings:
            print("{file}:{line}: {rule} [{fingerprint}]".format(**item))
        for item in expired:
            print("{file}:{line}: expired exception for {rule} [{fingerprint}]".format(**item))
    return 1 if findings or expired else 0


if __name__ == "__main__":
    sys.exit(main())
