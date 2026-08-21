#!/usr/bin/env python3
"""Deterministic context-economy guard for the Contabilidade repository.

This is the Contabilidade adaptation of PRIMA's context governance contract. It
keeps routing documents small, prevents duplicated HOT context, validates compact
launchers and rejects stable bootstrap files containing transient history.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

ROOT_AGENT_LIMITS = (6_000, 7_000)
CHILD_AGENT_LIMITS = (2_500, 3_500)
AGENT_CHAIN_LIMITS = (9_000, 10_000)
HOT_LIMITS: dict[str, tuple[int, int]] = {
    "AGENTS.md": ROOT_AGENT_LIMITS,
    "docs/INDICE_DOCUMENTACAO_ATIVA.md": (4_000, 5_500),
    "docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md": (6_500, 8_500),
    "docs/ai/CHAT_BOOTSTRAP.md": (2_200, 3_000),
    "docs/ai/CONTABILIDADE_NEW_CHAT_BOOTSTRAP.txt": (1_200, 1_800),
    "docs/ai/CONTABILIDADE_EXISTING_CHAT_RESYNC.txt": (1_200, 1_800),
}
REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    "AGENTS.md": (
        "CONTEXTO_E_ORCAMENTO.md",
        "Não pré-carregue",
        "context_governance_guard.py",
    ),
    "docs/INDICE_DOCUMENTACAO_ATIVA.md": (
        "índice de roteamento, não um bundle de contexto",
        "Próxima onda / reconciliação",
    ),
    "docs/ai/CHAT_BOOTSTRAP.md": (
        "CONTABILIDADE_NEW_CHAT_BOOTSTRAP.txt",
        "CONTABILIDADE_EXISTING_CHAT_RESYNC.txt",
    ),
}
STABLE_BOOTSTRAPS = {
    "docs/ai/CONTABILIDADE_NEW_CHAT_BOOTSTRAP.txt",
    "docs/ai/CONTABILIDADE_EXISTING_CHAT_RESYNC.txt",
}
REQUIRED_LAUNCHER_FIELDS = (
    "TASK:", "BASELINE:", "PREPARE:", "READ:", "LOCKS:",
    "OWNER:", "MIGRATION:", "VALIDATE:", "RESULT_MD:",
)
SHA_RE = re.compile(r"(?<![A-Za-z0-9])[0-9a-f]{12,40}(?![A-Za-z0-9])", re.I)
PR_RE = re.compile(r"(?<![A-Za-z0-9])#\d{2,}(?!\d)")
DATE_RE = re.compile(r"\b20\d{2}[-/]\d{2}[-/]\d{2}\b")
UNIVERSAL_READ_RE = re.compile(
    r"(?is)(?:read|leia|carregue).{0,120}(?:all|todos).{0,120}"
    r"(?:docs|documentation|documenta(?:ção|cao)|backlog|history|histórico|historico)"
)
NEGATED_UNIVERSAL_READ_PREFIX_RE = re.compile(
    r"(?is)(?:\bnot|\bnever|\bdo\s+not|\bdon['’]t|\bnão|\bnao)\s+"
    r"(?:(?:pre|pré)[- ]?)?$"
)


@dataclass(frozen=True)
class Finding:
    severity: str
    code: str
    path: str
    message: str


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def requires_universal_read(text: str) -> bool:
    for match in UNIVERSAL_READ_RE.finditer(text):
        prefix = text[max(0, match.start() - 24) : match.start()]
        if NEGATED_UNIVERSAL_READ_PREFIX_RE.search(prefix):
            continue
        return True
    return False


def run_git(root: Path, arguments: list[str]) -> list[str]:
    completed = subprocess.run(
        ["git", *arguments], cwd=root, capture_output=True, text=True, check=False,
    )
    if completed.returncode:
        raise RuntimeError(completed.stderr.strip() or f"git {' '.join(arguments)} failed")
    return [line.strip() for line in completed.stdout.splitlines() if line.strip()]


def git_changed_files(root: Path, base: str | None) -> list[str]:
    return run_git(root, ["diff", "--name-only", base, "--"]) if base else []


def git_agent_files(root: Path) -> list[str]:
    return sorted(path for path in run_git(root, ["ls-files"]) if path == "AGENTS.md" or path.endswith("/AGENTS.md"))


def agent_chain(relative: str, available: set[str]) -> list[str]:
    if relative == "AGENTS.md":
        return [relative]
    directories = Path(relative).as_posix().split("/")[:-1]
    candidates = ["AGENTS.md"]
    for index in range(1, len(directories) + 1):
        candidates.append("/".join(directories[:index] + ["AGENTS.md"]))
    return [candidate for candidate in candidates if candidate in available]


def normalize_paragraph(text: str) -> str:
    return " ".join(text.lower().split())


def duplicate_paragraphs(files: dict[str, str]) -> list[Finding]:
    seen: dict[str, set[str]] = {}
    for path, text in files.items():
        for paragraph in re.split(r"\n\s*\n", text):
            normalized = normalize_paragraph(paragraph)
            if len(normalized) >= 180:
                seen.setdefault(normalized, set()).add(path)
    return [
        Finding(
            "WARNING", "HOT_CONTEXT_DUPLICATE", ", ".join(sorted(paths)),
            "O mesmo parágrafo normalizado aparece em mais de um arquivo HOT; use referência canônica.",
        )
        for paths in seen.values() if len(paths) > 1
    ]


def fenced_blocks(text: str) -> Iterable[tuple[int, str]]:
    for index, match in enumerate(re.finditer(r"```[^\n]*\n(.*?)```", text, re.S), start=1):
        yield index, match.group(1).strip("\n")


def validate_launcher(path: str, index: int, block: str) -> list[Finding]:
    if not re.search(r"(?m)^TASK:\s*\S+", block):
        return []
    findings: list[Finding] = []
    label = f"{path}#fence-{index}"
    lines = [line for line in block.splitlines() if line.strip()]
    if len(lines) > 20 or len(block) > 2_000:
        findings.append(Finding(
            "ERROR", "LAUNCHER_BUDGET_EXCEEDED", label,
            f"{len(lines)} linhas não vazias/{len(block)} caracteres; limites 20/2000.",
        ))
    for field in REQUIRED_LAUNCHER_FIELDS:
        if sum(1 for line in lines if line.startswith(field)) != 1:
            findings.append(Finding(
                "ERROR", "LAUNCHER_FIELD_COUNT", label,
                f"{field} deve ocorrer exatamente uma vez.",
            ))
    if any(pattern.search(block) for pattern in (PR_RE, DATE_RE)):
        findings.append(Finding(
            "ERROR", "LAUNCHER_DYNAMIC_HISTORY", label,
            "Launcher contém PR/data transitória; recupere estado do checkpoint em vez de copiar histórico.",
        ))
    if SHA_RE.search(block) and not re.search(r"(?m)^BASELINE:\s*(?:latest main|immutable [0-9a-f]{40})\s*$", block):
        findings.append(Finding(
            "ERROR", "LAUNCHER_DYNAMIC_SHA", label,
            "SHA só é permitido em BASELINE immutable; use 'latest main' nos demais launchers.",
        ))
    if re.search(r"(?im)^(TYPE|STATE|REQUIRED):", block):
        findings.append(Finding(
            "ERROR", "LAUNCHER_SECOND_SPECIFICATION", label,
            "TYPE/STATE/REQUIRED pertencem ao shard/checkpoint, não ao launcher compacto.",
        ))
    if re.search(r"\b(optionally|maybe|perhaps|if needed|se necessário|talvez)\b", block, re.I):
        findings.append(Finding(
            "ERROR", "LAUNCHER_UNRESOLVED_GATE", label,
            "Launcher contém escopo condicional não resolvido.",
        ))
    return findings


def launcher_paths(root: Path, changed: list[str]) -> list[str]:
    paths = {
        path for path in changed
        if path.endswith((".md", ".txt")) and (root / path).is_file()
    }
    released = root / "docs/orquestracao/waves/released"
    if released.exists():
        paths.update(path.relative_to(root).as_posix() for path in released.glob("*LAUNCHERS.txt"))
    return sorted(paths)


def validate_repository(root: Path, base: str | None = None) -> dict[str, object]:
    findings: list[Finding] = []
    hot: dict[str, str] = {}

    for relative, (warning_limit, hard_limit) in HOT_LIMITS.items():
        path = root / relative
        if not path.exists():
            findings.append(Finding("ERROR", "HOT_FILE_MISSING", relative, "Arquivo HOT obrigatório ausente."))
            continue
        text = read_text(path)
        hot[relative] = text
        size = len(text)
        if size > hard_limit:
            findings.append(Finding("ERROR", "HOT_CONTEXT_HARD_LIMIT", relative, f"{size}>{hard_limit} caracteres."))
        elif size > warning_limit:
            findings.append(Finding("WARNING", "HOT_CONTEXT_WARNING_LIMIT", relative, f"{size}>{warning_limit} caracteres."))
        for marker in REQUIRED_MARKERS.get(relative, ()):
            if marker not in text:
                findings.append(Finding("ERROR", "ROUTING_MARKER_MISSING", relative, f"Marcador ausente: {marker}"))
        if relative in STABLE_BOOTSTRAPS and any(pattern.search(text) for pattern in (SHA_RE, PR_RE, DATE_RE)):
            findings.append(Finding(
                "ERROR", "BOOTSTRAP_DYNAMIC_HISTORY", relative,
                "Bootstrap estável contém SHA/PR/data transitória.",
            ))
        if requires_universal_read(text):
            findings.append(Finding(
                "ERROR", "UNIVERSAL_READ_GRAPH", relative,
                "Arquivo HOT exige leitura universal; use roteamento progressivo HOT/WARM/COLD.",
            ))

    agents = {
        relative: read_text(root / relative)
        for relative in git_agent_files(root)
        if (root / relative).exists()
    }
    for relative, text in agents.items():
        if relative == "AGENTS.md":
            continue
        size = len(text)
        if size > CHILD_AGENT_LIMITS[1]:
            findings.append(Finding("ERROR", "CHILD_AGENT_HARD_LIMIT", relative, f"{size}>{CHILD_AGENT_LIMITS[1]} caracteres."))
        elif size > CHILD_AGENT_LIMITS[0]:
            findings.append(Finding("WARNING", "CHILD_AGENT_WARNING_LIMIT", relative, f"{size}>{CHILD_AGENT_LIMITS[0]} caracteres."))

    available = set(agents)
    for relative in agents:
        chain = agent_chain(relative, available)
        size = sum(len(agents[path]) for path in chain)
        if size > AGENT_CHAIN_LIMITS[1]:
            findings.append(Finding("ERROR", "AGENT_CHAIN_HARD_LIMIT", relative, f"{size}>{AGENT_CHAIN_LIMITS[1]} em {chain}."))
        elif size > AGENT_CHAIN_LIMITS[0]:
            findings.append(Finding("WARNING", "AGENT_CHAIN_WARNING_LIMIT", relative, f"{size}>{AGENT_CHAIN_LIMITS[0]} em {chain}."))

    findings.extend(duplicate_paragraphs({**hot, **agents}))
    changed = git_changed_files(root, base)
    for relative in launcher_paths(root, changed):
        text = read_text(root / relative)
        blocks = list(fenced_blocks(text))
        if not blocks and re.search(r"(?m)^TASK:\s*\S+", text):
            blocks = [(1, text)]
        for index, block in blocks:
            findings.extend(validate_launcher(relative, index, block))

    errors = sum(item.severity == "ERROR" for item in findings)
    warnings = sum(item.severity == "WARNING" for item in findings)
    return {
        "schemaVersion": "1.0",
        "status": "FAIL" if errors else ("WARN" if warnings else "PASS"),
        "errors": errors,
        "warnings": warnings,
        "findings": [asdict(item) for item in findings],
        "limits": {
            "rootAgent": ROOT_AGENT_LIMITS,
            "childAgents": CHILD_AGENT_LIMITS,
            "agentChain": AGENT_CHAIN_LIMITS,
            "hotFiles": HOT_LIMITS,
            "launcher": {"nonEmptyLines": 20, "characters": 2_000},
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--base")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    try:
        report = validate_repository(args.repo_root.resolve(), args.base)
    except (OSError, RuntimeError, UnicodeError) as exc:
        print(f"CONTEXT_GOVERNANCE_ERROR: {exc}")
        return 2
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    else:
        print(f"CONTEXT_GOVERNANCE_{report['status']} errors={report['errors']} warnings={report['warnings']}")
        for finding in report["findings"]:
            print(f"{finding['severity']} {finding['code']} {finding['path']}: {finding['message']}")
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
