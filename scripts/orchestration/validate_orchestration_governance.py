#!/usr/bin/env python3
"""Deterministic governance guard for Contabilidade orchestration."""
from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

REQUIRED_PATHS = (
    "AGENTS.md",
    "backend/AGENTS.md",
    "frontend/AGENTS.md",
    "automation-worker/AGENTS.md",
    "docs/AGENTS.md",
    "docs/orquestracao/AGENTS.md",
    "docs/testing/AGENTS.md",
    "scripts/AGENTS.md",
    "scripts/orchestration/AGENTS.md",
    "docs/INDICE_DOCUMENTACAO_ATIVA.md",
    "docs/GOVERNANCA_DOCUMENTACAO.md",
    "docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md",
    "docs/orquestracao/CONTABILIDADE_WAVE_ORCHESTRATION_V2.md",
    "docs/testing/MASTER_TEST_ORCHESTRATION.md",
    "docs/ai/CONTEXTO_E_ORCAMENTO.md",
    "docs/ai/TEMPLATE_LAUNCHER_COMPACTO.md",
    "docs/roadmap/BACKLOG_ESTRUTURAL.md",
    "docs/decisoes/CONTABILIDADE_LOCKS_OPERACIONAIS.md",
    ".contabilidade-orchestrator/config.json",
)

HOT_LIMITS = {
    "AGENTS.md": (8000, 11000),
    "docs/INDICE_DOCUMENTACAO_ATIVA.md": (6000, 8500),
    "docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md": (6500, 8500),
    "docs/ai/CHAT_BOOTSTRAP.md": (3000, 4500),
}

REQUIRED_MARKERS = {
    "AGENTS.md": (
        "CONTEXTO_E_ORCAMENTO.md",
        "até cinco",
        "no máximo um owner de migration",
        "validação estrutural somente",
    ),
    "docs/INDICE_DOCUMENTACAO_ATIVA.md": (
        "índice de roteamento",
        "CONTABILIDADE_CURRENT_STATE",
        "MASTER_TEST_ORCHESTRATION",
    ),
    "docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md": (
        "CANONICAL_ACTIVE_CHECKPOINT",
        "PR aberta",
        "Frontier Flyway",
    ),
    "docs/ai/CHAT_BOOTSTRAP.md": (
        "Novo chat",
        "Ressincronização",
        "validate_prompt.py",
    ),
}

FORBIDDEN_RIGID_PATTERNS = (
    re.compile(r"exatamente\s+cinco", re.I),
    re.compile(r"sempre\s+cinco", re.I),
)


@dataclass(frozen=True)
class Finding:
    severity: str
    code: str
    path: str
    message: str


def read(root: Path, relative: str) -> str:
    return (root / relative).read_text(encoding="utf-8")


def validate_config(root: Path, findings: list[Finding]) -> None:
    path = ".contabilidade-orchestrator/config.json"
    try:
        config = json.loads(read(root, path))
    except (OSError, json.JSONDecodeError) as exc:
        findings.append(Finding("ERROR", "CONFIG_INVALID", path, str(exc)))
        return
    if config.get("schemaVersion") != "2.0":
        findings.append(Finding("ERROR", "CONFIG_SCHEMA", path, "schemaVersion must be 2.0."))
    waves = config.get("ondas", {})
    if waves.get("minOwnersExecutaveis") != 1:
        findings.append(Finding("ERROR", "WAVE_MIN", path, "minOwnersExecutaveis must be 1."))
    if waves.get("maxOwnersExecutaveis") != 5:
        findings.append(Finding("ERROR", "WAVE_MAX", path, "maxOwnersExecutaveis must be 5."))
    if waves.get("migrationOwnerLimit") != 1:
        findings.append(Finding("ERROR", "MIGRATION_LIMIT", path, "migrationOwnerLimit must be 1."))
    if waves.get("dependenciaMesmaOndaPermitida") is not False:
        findings.append(Finding("ERROR", "SAME_WAVE_DEPENDENCY", path, "Same-wave dependencies must be false."))
    git = config.get("git", {})
    if git.get("pushDiretoIntegracaoPermitido") is not False:
        findings.append(Finding("ERROR", "DIRECT_PUSH", path, "Direct push to integration must be false."))
    external = config.get("operacoesExternas", {})
    if external.get("providerRealDefault") != "DENIED":
        findings.append(Finding("ERROR", "PROVIDER_DEFAULT", path, "Real provider default must be DENIED."))


def normalized_paragraphs(text: str) -> list[str]:
    result = []
    for paragraph in re.split(r"\n\s*\n", text):
        normalized = " ".join(paragraph.lower().split())
        if len(normalized) >= 220:
            result.append(normalized)
    return result


def validate(root: Path) -> dict[str, object]:
    findings: list[Finding] = []
    for relative in REQUIRED_PATHS:
        if not (root / relative).is_file():
            findings.append(Finding("ERROR", "REQUIRED_PATH_MISSING", relative, "Canonical file is missing."))

    for relative, (warning, error) in HOT_LIMITS.items():
        path = root / relative
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        size = len(text)
        if size > error:
            findings.append(Finding("ERROR", "HOT_CONTEXT_HARD_LIMIT", relative, f"{size} > {error} chars."))
        elif size > warning:
            findings.append(Finding("WARNING", "HOT_CONTEXT_WARNING", relative, f"{size} > {warning} chars."))
        for marker in REQUIRED_MARKERS.get(relative, ()):
            if marker not in text:
                findings.append(Finding("ERROR", "ROUTING_MARKER_MISSING", relative, f"Missing marker: {marker}"))

    rigid_paths = (
        "AGENTS.md",
        "docs/ai/FLUXO_TRABALHO_CODEX.md",
        "docs/orquestracao/CONTABILIDADE_WAVE_ORCHESTRATION_V2.md",
        ".contabilidade-orchestrator/README.md",
    )
    for relative in rigid_paths:
        path = root / relative
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        for pattern in FORBIDDEN_RIGID_PATTERNS:
            if pattern.search(text):
                findings.append(Finding("ERROR", "RIGID_FIVE_REINTRODUCED", relative, "Use capacity up to five, not exactly five."))

    validate_config(root, findings)

    preview_readme = root / ".contabilidade-orchestrator/output/prompts/README.md"
    if preview_readme.is_file() and "LEGACY_NOT_EXECUTABLE" not in preview_readme.read_text(encoding="utf-8"):
        findings.append(Finding("ERROR", "LEGACY_PROMPTS_ACTIVE", str(preview_readme.relative_to(root)), "Legacy prompts must be marked non-executable."))

    hot_texts = {}
    for relative in HOT_LIMITS:
        path = root / relative
        if path.is_file():
            hot_texts[relative] = path.read_text(encoding="utf-8")
    seen: dict[str, list[str]] = {}
    for relative, text in hot_texts.items():
        for paragraph in normalized_paragraphs(text):
            seen.setdefault(paragraph, []).append(relative)
    for sources in seen.values():
        unique = sorted(set(sources))
        if len(unique) > 1:
            findings.append(Finding("WARNING", "EXACT_HOT_DUPLICATE", ", ".join(unique), "Same long normalized paragraph appears in multiple HOT files."))

    errors = sum(1 for item in findings if item.severity == "ERROR")
    warnings = sum(1 for item in findings if item.severity == "WARNING")
    return {
        "status": "FAIL" if errors else "PASS",
        "errors": errors,
        "warnings": warnings,
        "findings": [asdict(item) for item in findings],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--json-output", type=Path)
    args = parser.parse_args()
    report = validate(args.repo_root.resolve())
    if args.json_output:
        args.json_output.parent.mkdir(parents=True, exist_ok=True)
        args.json_output.write_text(json.dumps(report, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Orchestration governance: {report['status']}")
    print(f"Errors: {report['errors']}")
    print(f"Warnings: {report['warnings']}")
    for item in report["findings"]:
        print(f"[{item['severity']}] {item['code']} {item['path']}: {item['message']}")
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
