#!/usr/bin/env python3
"""Deterministic, dependency-free architecture boundary guard."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path, PurePath

IMPORT_TS = re.compile(r"(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]")
IMPORT_JAVA = re.compile(r"^\s*import\s+(?:static\s+)?([\w.]+)", re.MULTILINE)


def canonical_path_key(path: PurePath) -> str:
    """Order paths identically on Windows and POSIX hosts."""
    return path.as_posix()


def canonical_edge_key(edge: tuple[Path, Path]) -> tuple[str, str]:
    return canonical_path_key(edge[0]), canonical_path_key(edge[1])


@dataclass(frozen=True, order=True)
class Finding:
    rule: str
    source: str
    target: str

    @property
    def fingerprint(self) -> str:
        value = f"{self.rule}\0{self.source}\0{self.target}".encode()
        return hashlib.sha256(value).hexdigest()[:20]

    def record(self) -> dict[str, str]:
        return {**asdict(self), "fingerprint": self.fingerprint}


def _relative_target(source: Path, specifier: str, files: set[Path], root: Path) -> Path | None:
    if specifier.startswith("@/"):
        candidate = root / specifier[2:]
    elif specifier.startswith("."):
        candidate = source.parent / specifier
    else:
        return None
    choices = [candidate, candidate.with_suffix(".ts"), candidate.with_suffix(".tsx"),
               candidate / "index.ts", candidate / "index.tsx"]
    return next((p.resolve() for p in choices if p.resolve() in files), None)


def typescript_edges(root: Path) -> list[tuple[Path, Path]]:
    paths = sorted((p for p in (*root.rglob("*.ts"), *root.rglob("*.tsx"))
                    if not re.search(r"\.(?:test|spec)\.tsx?$", p.name)),
                   key=canonical_path_key)
    files = {p.resolve() for p in paths}
    edges: set[tuple[Path, Path]] = set()
    for source in paths:
        for specifier in IMPORT_TS.findall(source.read_text(encoding="utf-8")):
            target = _relative_target(source.resolve(), specifier, files, root.resolve())
            if target:
                edges.add((source.resolve(), target))
    return sorted(edges, key=canonical_edge_key)


def java_edges(root: Path) -> list[tuple[Path, Path]]:
    paths = sorted(root.rglob("*.java"), key=canonical_path_key)
    classes = {}
    for path in paths:
        package = re.search(r"^\s*package\s+([\w.]+)", path.read_text(encoding="utf-8"), re.MULTILINE)
        if package:
            classes[f"{package.group(1)}.{path.stem}"] = path.resolve()
    edges = set()
    for source in paths:
        for imported in IMPORT_JAVA.findall(source.read_text(encoding="utf-8")):
            if imported in classes:
                edges.add((source.resolve(), classes[imported]))
    return sorted(edges, key=canonical_edge_key)


def _cycle_findings(edges: list[tuple[Path, Path]], base: Path, scope: str) -> list[Finding]:
    graph: dict[Path, set[Path]] = {}
    for source, target in edges:
        graph.setdefault(source, set()).add(target)
        graph.setdefault(target, set())
    index = 0
    stack: list[Path] = []
    indexes: dict[Path, int] = {}
    low: dict[Path, int] = {}
    active: set[Path] = set()
    components: list[list[Path]] = []

    def visit(node: Path) -> None:
        nonlocal index
        indexes[node] = low[node] = index
        index += 1
        stack.append(node); active.add(node)
        for target in sorted(graph[node], key=canonical_path_key):
            if target not in indexes:
                visit(target); low[node] = min(low[node], low[target])
            elif target in active:
                low[node] = min(low[node], indexes[target])
        if low[node] == indexes[node]:
            component = []
            while True:
                item = stack.pop(); active.remove(item); component.append(item)
                if item == node: break
            if len(component) > 1 or node in graph[node]:
                components.append(sorted(component, key=canonical_path_key))
    for node in sorted(graph, key=canonical_path_key):
        if node not in indexes: visit(node)
    findings = []
    for component in sorted(components, key=lambda paths: tuple(map(canonical_path_key, paths))):
        names = [p.relative_to(base).as_posix() for p in component]
        findings.append(Finding(f"{scope}.cycle", names[0], " -> ".join(names)))
    return findings


def analyze(repo: Path) -> tuple[list[Finding], dict[str, list[dict[str, str]]]]:
    repo = repo.resolve()
    backend_root = repo / "backend/src/main/java"
    frontend_root = repo / "frontend/src"
    worker_root = repo / "automation-worker/src"
    sets = {"backend": java_edges(backend_root), "frontend": typescript_edges(frontend_root),
            "worker": typescript_edges(worker_root)}
    findings: list[Finding] = []
    for scope, edges in sets.items(): findings.extend(_cycle_findings(edges, repo, scope))
    for source, target in sets["backend"]:
        s = source.relative_to(backend_root).parts[3:]
        t = target.relative_to(backend_root).parts[3:]
        if s and t and s[0] == "common" and t[0] != "common":
            findings.append(Finding("backend.common_to_feature", source.relative_to(repo).as_posix(), target.relative_to(repo).as_posix()))
        if len(s) > 1 and len(t) > 1 and s[0] not in ("common", t[0]) and t[1] in ("repository", "api", "controller"):
            findings.append(Finding("backend.cross_feature_internal", source.relative_to(repo).as_posix(), target.relative_to(repo).as_posix()))
    for source, target in sets["frontend"]:
        s = source.relative_to(frontend_root).parts[0]
        t = target.relative_to(frontend_root).parts[0]
        rule = "frontend.api_to_ui" if s == "api" and t in ("pages", "app") else "frontend.page_to_page" if s == t == "pages" else None
        if rule: findings.append(Finding(rule, source.relative_to(repo).as_posix(), target.relative_to(repo).as_posix()))
    provider = re.compile(r"(?:Federal|Pge|Sefaz|Serpro).*(?:Flow|Provider)\.ts$")
    core = re.compile(r"(?:contracts|config|WorkerLoop|FluxoRegistry|index|server)\.ts$")
    for source, target in sets["worker"]:
        if core.search(source.name) and provider.search(target.name):
            findings.append(Finding("worker.core_to_provider", source.relative_to(repo).as_posix(), target.relative_to(repo).as_posix()))
    graph = {scope: [{"source": s.relative_to(repo).as_posix(), "target": t.relative_to(repo).as_posix()} for s, t in edges]
             for scope, edges in sets.items()}
    return sorted(set(findings)), graph


def validate_allowlist(findings: list[Finding], allowlist: dict, today: date) -> list[str]:
    errors = []
    entries = allowlist.get("entries", [])
    required = {"fingerprint", "rule", "source", "target", "reason", "owner", "review_by"}
    for entry in entries:
        missing = required - entry.keys()
        if missing: errors.append(f"allowlist entry missing: {', '.join(sorted(missing))}"); continue
        try: expired = date.fromisoformat(entry["review_by"]) < today
        except ValueError: errors.append(f"invalid review_by: {entry['review_by']}"); continue
        if expired: errors.append(f"expired allowlist entry: {entry['fingerprint']}")
    allowed = {e.get("fingerprint") for e in entries}
    for finding in findings:
        if finding.fingerprint not in allowed:
            errors.append(f"NEW {finding.rule}: {finding.source} -> {finding.target} [{finding.fingerprint}]")
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("check", "inventory"))
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--allowlist", type=Path, default=Path(__file__).with_name("allowlist.json"))
    parser.add_argument("--baseline", type=Path, default=Path(__file__).with_name("baseline.json"))
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)
    findings, graph = analyze(args.repo)
    if args.command == "inventory":
        payload = {"schema_version": 1, "graph": graph, "findings": [f.record() for f in findings]}
        rendered = json.dumps(payload, indent=2, sort_keys=True) + "\n"
        args.output.write_bytes(rendered.encode("utf-8")) if args.output else print(rendered, end="")
        return 0
    allowlist = json.loads(args.allowlist.read_text(encoding="utf-8"))
    errors = validate_allowlist(findings, allowlist, date.today())
    expected = json.loads(args.baseline.read_text(encoding="utf-8"))
    actual = {"schema_version": 1, "graph": graph, "findings": [f.record() for f in findings]}
    if expected != actual:
        errors.append("dependency graph differs from baseline; review findings and regenerate inventory")
    if errors:
        print("Architecture boundary guard failed:\n" + "\n".join(f"- {e}" for e in errors), file=sys.stderr)
        return 1
    print(f"Architecture boundary guard passed ({sum(map(len, graph.values()))} edges, {len(findings)} allowed findings).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
