#!/usr/bin/env python3
"""Validate Contabilidade chat prompts and executable launcher packs."""
from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

SHA_RE = re.compile(r"(?<![A-Za-z0-9])[0-9a-f]{12,40}(?![A-Za-z0-9])", re.I)
PR_RE = re.compile(r"(?<![A-Za-z0-9])#\d{2,}(?!\d)")
DATE_RE = re.compile(r"\b20\d{2}-\d{2}-\d{2}\b")


@dataclass(frozen=True)
class Finding:
    severity: str
    code: str
    message: str


def lines(text: str) -> list[str]:
    return [line.strip() for line in text.splitlines() if line.strip()]


def add(items: list[Finding], severity: str, code: str, message: str) -> None:
    items.append(Finding(severity, code, message))


def reusable_checks(text: str, findings: list[Finding]) -> None:
    if SHA_RE.search(text):
        add(findings, "ERROR", "DYNAMIC_SHA", "Reusable prompt must not embed a commit SHA.")
    if PR_RE.search(text):
        add(findings, "ERROR", "DYNAMIC_PR", "Reusable prompt must not embed a PR number.")
    if DATE_RE.search(text):
        add(findings, "ERROR", "DYNAMIC_DATE", "Reusable prompt must not embed dated state.")
    if "PREPARED_NOT_RELEASED" in text:
        add(findings, "ERROR", "PREPARED_EMBEDDED", "Reusable prompt must not embed a prepared wave.")


def require(text: str, values: tuple[str, ...], findings: list[Finding], code: str) -> None:
    missing = [value for value in values if value.lower() not in text.lower()]
    if missing:
        add(findings, "ERROR", code, "Missing: " + ", ".join(missing))


def validate_bootstrap(text: str) -> list[Finding]:
    findings: list[Finding] = []
    reusable_checks(text, findings)
    if len(lines(text)) > 22:
        add(findings, "ERROR", "BOOTSTRAP_LINES", "Bootstrap exceeds 22 non-empty lines.")
    if len(text) > 2400:
        add(findings, "ERROR", "BOOTSTRAP_CHARS", "Bootstrap exceeds 2400 characters.")
    if "TASK:" in text:
        add(findings, "ERROR", "BOOTSTRAP_TASK", "Bootstrap must not launch a task.")
    require(
        text,
        (
            "mavinny02-wq/contabilidade",
            "main",
            "AGENTS.md",
            "CONTABILIDADE_CURRENT_STATE.md",
            "CONTEXTO_E_ORCAMENTO.md",
            "explicit trigger",
        ),
        findings,
        "BOOTSTRAP_REQUIRED",
    )
    return findings


def validate_resync(text: str) -> list[Finding]:
    findings: list[Finding] = []
    reusable_checks(text, findings)
    if len(lines(text)) > 26:
        add(findings, "ERROR", "RESYNC_LINES", "Resync exceeds 26 non-empty lines.")
    if len(text) > 2800:
        add(findings, "ERROR", "RESYNC_CHARS", "Resync exceeds 2800 characters.")
    if "TASK:" in text:
        add(findings, "ERROR", "RESYNC_TASK", "Resync must not launch a task.")
    require(
        text,
        ("AGENTS.md", "CONTABILIDADE_CURRENT_STATE.md", "CONTEXTO_E_ORCAMENTO.md", "HEAD", "OPEN_PRS", "COLD"),
        findings,
        "RESYNC_REQUIRED",
    )
    if "No execution" not in text and "Do not execute" not in text:
        add(findings, "ERROR", "RESYNC_EXECUTION_GUARD", "Resync must forbid execution.")
    return findings


def field_count(nonempty: list[str], field: str) -> int:
    return sum(1 for line in nonempty if line.startswith(field))


def validate_launcher(text: str) -> list[Finding]:
    findings: list[Finding] = []
    nonempty = lines(text)
    if len(nonempty) > 20:
        add(findings, "ERROR", "LAUNCHER_LINES", "Launcher exceeds 20 non-empty lines.")
    if len(text) > 2000:
        add(findings, "ERROR", "LAUNCHER_CHARS", "Launcher exceeds 2000 characters.")
    for field in ("TASK:", "BASELINE:", "PREPARE:", "READ:", "LOCKS:", "OWNER:", "MIGRATION:", "VALIDATE:", "RESULT_MD:"):
        count = field_count(nonempty, field)
        if count != 1:
            add(findings, "ERROR", "LAUNCHER_FIELD", f"{field} must occur exactly once; found {count}.")
    for obsolete in ("TYPE:", "STATE:", "REQUIRED:", "EXECUTION MODE:"):
        if any(line.upper().startswith(obsolete) for line in nonempty):
            add(findings, "ERROR", "SECOND_SPECIFICATION", f"{obsolete} is not allowed in compact launcher.")
    if SHA_RE.search(text) or PR_RE.search(text) or DATE_RE.search(text):
        add(findings, "ERROR", "LAUNCHER_DYNAMIC_HISTORY", "Launcher must not copy historical PR/SHA/date state.")
    if "PREPARED_NOT_RELEASED" in text:
        add(findings, "ERROR", "LAUNCHER_NOT_RELEASED", "Prepared state cannot be executable.")
    if re.search(r"\b(if needed|optionally|maybe|perhaps)\b", text, re.I):
        add(findings, "ERROR", "UNRESOLVED_GATE", "Launcher contains conditional/optional scope.")
    migration = next((line.split(":", 1)[1].strip() for line in nonempty if line.startswith("MIGRATION:")), "")
    if not migration:
        add(findings, "ERROR", "MIGRATION_EMPTY", "MIGRATION must be NONE or an exact owner.")
    return findings


def split_launchers(text: str) -> list[str]:
    starts = [m.start() for m in re.finditer(r"(?m)^TASK:\s*\S+", text)]
    if not starts:
        return []
    starts.append(len(text))
    return [text[starts[i]:starts[i + 1]].strip() for i in range(len(starts) - 1)]


def validate_pack(text: str) -> list[Finding]:
    findings: list[Finding] = []
    launchers = split_launchers(text)
    if not launchers:
        add(findings, "ERROR", "PACK_EMPTY", "Pack contains no launchers.")
        return findings
    if len(launchers) > 5:
        add(findings, "ERROR", "PACK_CAPACITY", f"Pack contains {len(launchers)} launchers; maximum is 5.")
    migration_owners = 0
    task_ids: list[str] = []
    for index, launcher in enumerate(launchers, 1):
        nested = validate_launcher(launcher)
        for finding in nested:
            findings.append(Finding(finding.severity, f"PACK_{index}_{finding.code}", finding.message))
        task_line = next((line for line in lines(launcher) if line.startswith("TASK:")), "")
        task_ids.append(task_line)
        migration = next((line.split(":", 1)[1].strip() for line in lines(launcher) if line.startswith("MIGRATION:")), "")
        if migration and migration.upper() != "NONE":
            migration_owners += 1
    if len(set(task_ids)) != len(task_ids):
        add(findings, "ERROR", "PACK_DUPLICATE_TASK", "Pack repeats a TASK.")
    if migration_owners > 1:
        add(findings, "ERROR", "PACK_MIGRATION_OWNERS", "Pack has more than one migration owner.")
    return findings


def validate(text: str, mode: str) -> list[Finding]:
    return {
        "bootstrap": validate_bootstrap,
        "resync": validate_resync,
        "launcher": validate_launcher,
        "pack": validate_pack,
    }[mode](text)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=Path)
    parser.add_argument("--mode", required=True, choices=("bootstrap", "resync", "launcher", "pack"))
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    text = args.path.read_text(encoding="utf-8")
    findings = validate(text, args.mode)
    valid = not any(item.severity == "ERROR" for item in findings)
    result = {
        "valid": valid,
        "mode": args.mode,
        "path": str(args.path),
        "characters": len(text),
        "nonempty_lines": len(lines(text)),
        "estimated_tokens_method": "heuristic_chars_div_4",
        "estimated_tokens": (len(text) + 3) // 4,
        "findings": [asdict(item) for item in findings],
    }
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
    else:
        print("PROMPT_VALID" if valid else "PROMPT_INVALID")
        for item in findings:
            print(f"{item.severity} {item.code}: {item.message}")
    return 0 if valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
