#!/usr/bin/env python3
"""Validate the stable Required CI workflow contract without third-party Python packages."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

WORKFLOW = Path(".github/workflows/required-ci.yml")
MANDATORY = {"governance", "backend-postgresql", "frontend", "worker", "performance-budgets"}
REQUIRED_CONTROLS = {
    "coverage": ("test:coverage", "jacoco:report", "coverage_ratchet.py"),
    "openapi": ("test_openapi_guard.py", "openapi_guard.py check", "frontend-usage.json"),
    "synthetic fixtures": ("synthetic_fixture_guard.py", "test_synthetic_fixture_guard.py"),
    "performance budgets": ("artifact_budget.py measure", "artifact_budget.py guard"),
    "secret/PII": ("secret_pii_guard.py",),
    "migrations": ("assert-migrations-immutable.sh", "validate-migration-registry.mjs"),
    "version": ("validate-version-governance.py",),
    "wave manifests": ("validate_wave_manifests.py",),
    "dependency policy": ("test_dependency_guard.py", "generate-sboms.sh"),
}


class _StrictYamlSubset:
    """Parse the dependency-free YAML subset used by GitHub workflow files."""

    def __init__(self, source: str) -> None:
        if "\t" in source:
            raise ValueError("tabs are not supported")
        self.lines = source.splitlines()

    def parse(self) -> dict[str, Any]:
        index = self._next_content(0)
        if index is None:
            raise ValueError("document is empty")
        value, index = self._parse_block(index, self._indent(index))
        if self._next_content(index) is not None:
            raise ValueError("unexpected trailing content")
        if not isinstance(value, dict):
            raise ValueError("workflow root must be a mapping")
        return value

    def _next_content(self, index: int) -> int | None:
        while index < len(self.lines):
            stripped = self.lines[index].strip()
            if stripped and not stripped.startswith("#"):
                return index
            index += 1
        return None

    def _indent(self, index: int) -> int:
        return len(self.lines[index]) - len(self.lines[index].lstrip(" "))

    def _parse_block(self, index: int, indent: int) -> tuple[Any, int]:
        if self.lines[index][indent:].startswith("- "):
            return self._parse_sequence(index, indent)
        return self._parse_mapping(index, indent)

    def _parse_mapping(self, index: int, indent: int) -> tuple[dict[str, Any], int]:
        result: dict[str, Any] = {}
        while True:
            current = self._next_content(index)
            if current is None:
                return result, len(self.lines)
            current_indent = self._indent(current)
            if current_indent < indent:
                return result, current
            if current_indent > indent:
                raise ValueError(f"unexpected indentation at line {current + 1}")
            text = self.lines[current][indent:]
            if text.startswith("- "):
                return result, current
            key, raw_value = self._mapping_entry(text, current)
            if key in result:
                raise ValueError(f"duplicate key {key!r} at line {current + 1}")
            index = current + 1
            if raw_value in ("|", "|-", "|+"):
                result[key], index = self._block_scalar(index, indent)
                continue
            if raw_value:
                result[key] = self._scalar(raw_value, current)
                continue
            child = self._next_content(index)
            if child is None or self._indent(child) <= indent:
                result[key] = {}
                continue
            result[key], index = self._parse_block(child, self._indent(child))

    def _parse_sequence(self, index: int, indent: int) -> tuple[list[Any], int]:
        result: list[Any] = []
        while True:
            current = self._next_content(index)
            if current is None:
                return result, len(self.lines)
            current_indent = self._indent(current)
            if current_indent < indent:
                return result, current
            if current_indent != indent or not self.lines[current][indent:].startswith("- "):
                return result, current
            raw_item = self.lines[current][indent + 2 :].strip()
            index = current + 1
            if not raw_item:
                child = self._next_content(index)
                if child is None or self._indent(child) <= indent:
                    raise ValueError(f"empty sequence item at line {current + 1}")
                value, index = self._parse_block(child, self._indent(child))
                result.append(value)
                continue
            if self._looks_like_mapping_entry(raw_item):
                key, raw_value = self._mapping_entry(raw_item, current)
                item: dict[str, Any] = {}
                if raw_value in ("|", "|-", "|+"):
                    item[key], index = self._block_scalar(index, indent + 2)
                elif raw_value:
                    item[key] = self._scalar(raw_value, current)
                else:
                    child = self._next_content(index)
                    if child is None or self._indent(child) <= indent:
                        item[key] = {}
                    else:
                        item[key], index = self._parse_block(child, self._indent(child))
                continuation = self._next_content(index)
                if continuation is not None and self._indent(continuation) > indent:
                    extra, index = self._parse_mapping(continuation, self._indent(continuation))
                    duplicate = set(item).intersection(extra)
                    if duplicate:
                        raise ValueError(f"duplicate sequence mapping key: {sorted(duplicate)[0]}")
                    item.update(extra)
                result.append(item)
                continue
            result.append(self._scalar(raw_item, current))

    def _block_scalar(self, index: int, parent_indent: int) -> tuple[str, int]:
        end = index
        content_indents: list[int] = []
        while end < len(self.lines):
            line = self.lines[end]
            if line.strip() and self._indent(end) <= parent_indent:
                break
            if line.strip():
                content_indents.append(self._indent(end))
            end += 1
        if not content_indents:
            return "", end
        content_indent = min(content_indents)
        content = [line[content_indent:] if line.strip() else "" for line in self.lines[index:end]]
        return "\n".join(content) + "\n", end

    @staticmethod
    def _looks_like_mapping_entry(text: str) -> bool:
        return re.match(r"^[A-Za-z0-9_-]+:\s*", text) is not None

    @staticmethod
    def _mapping_entry(text: str, index: int) -> tuple[str, str]:
        match = re.fullmatch(r"([A-Za-z0-9_-]+):(?:\s+(.*))?", text)
        if match is None:
            raise ValueError(f"invalid mapping entry at line {index + 1}")
        return match.group(1), (match.group(2) or "").strip()

    def _scalar(self, value: str, index: int) -> Any:
        if value.startswith("["):
            if not value.endswith("]"):
                raise ValueError(f"unterminated inline sequence at line {index + 1}")
            body = value[1:-1].strip()
            return [] if not body else [self._scalar(item.strip(), index) for item in body.split(",")]
        if value.startswith('"'):
            try:
                return json.loads(value)
            except json.JSONDecodeError as exc:
                raise ValueError(f"invalid quoted scalar at line {index + 1}") from exc
        if value.startswith("'"):
            if not value.endswith("'"):
                raise ValueError(f"invalid quoted scalar at line {index + 1}")
            return value[1:-1].replace("''", "'")
        lowered = value.lower()
        if lowered in ("true", "false"):
            return lowered == "true"
        if lowered in ("null", "~"):
            return None
        if re.fullmatch(r"-?(0|[1-9][0-9]*)", value):
            return int(value)
        if value.startswith(("&", "*", "!", "{", ">")):
            raise ValueError(f"unsupported YAML feature at line {index + 1}")
        return value


def load_yaml(path: Path) -> dict[str, Any]:
    source = path.read_text(encoding="utf-8")
    try:
        loaded = json.loads(source)
    except json.JSONDecodeError:
        try:
            return _StrictYamlSubset(source).parse()
        except ValueError as exc:
            raise ValueError(f"invalid YAML: {exc}") from exc
    if not isinstance(loaded, dict):
        raise ValueError("invalid YAML: workflow root must be a mapping")
    return loaded


def commands(job: dict) -> str:
    return "\n".join(str(step.get("run", "")) for step in job.get("steps", []))


def validate(path: Path = WORKFLOW) -> list[str]:
    try:
        workflow = load_yaml(path)
    except (ValueError, json.JSONDecodeError) as exc:
        return [str(exc)]

    errors: list[str] = []
    if workflow.get("name") != "Required CI":
        errors.append("workflow name must be 'Required CI'")
    # Keep compatibility with evidence produced by older YAML 1.1 tooling, which
    # may have serialized the unquoted GitHub key `on` as the string key "true".
    triggers = workflow.get("on", workflow.get("true", {}))
    for trigger in ("pull_request", "push", "workflow_dispatch"):
        if trigger not in triggers:
            errors.append(f"required trigger missing: {trigger}")
    for trigger in ("pull_request", "push"):
        config = triggers.get(trigger, {})
        if isinstance(config, dict) and any(key in config for key in ("paths", "paths-ignore")):
            errors.append(f"{trigger} must not use a path filter")
    push = triggers.get("push", {})
    if not isinstance(push, dict) or "main" not in push.get("branches", []):
        errors.append("push must include main")
    jobs = workflow.get("jobs", {})
    missing = MANDATORY - jobs.keys()
    if missing:
        errors.append(f"mandatory lanes missing: {', '.join(sorted(missing))}")
    final = jobs.get("required-ci", {})
    needs = final.get("needs", [])
    if isinstance(needs, str):
        needs = [needs]
    if set(needs) != MANDATORY:
        errors.append("required-ci must need exactly every mandatory lane")
    if str(final.get("if", "")).strip() != "always()":
        errors.append("required-ci must use if: always()")
    if "all(result == \"success\"" not in commands(final):
        errors.append("required-ci must fail unless every needed job succeeded")
    for lane in MANDATORY:
        job = jobs.get(lane, {})
        if job.get("continue-on-error") is not None or any(
            step.get("continue-on-error") is not None for step in job.get("steps", [])
        ):
            errors.append(f"{lane} must not declare continue-on-error")
        if job.get("if") is not None:
            errors.append(f"{lane} must not be conditionally skipped")
    all_commands = "\n".join(commands(job) for job in jobs.values())
    for control, tokens in REQUIRED_CONTROLS.items():
        if not all(token in all_commands for token in tokens):
            errors.append(f"completed control missing: {control}")
    forbidden_log_tokens = ("printenv", "env |", "tojson(github)", "github_event_path", "secrets.")
    for token in forbidden_log_tokens:
        if token in all_commands.lower():
            errors.append(f"unsafe diagnostic logging token: {token}")
    if not all(token in all_commands for token in ("GITHUB_EVENT_NAME", "GITHUB_REF", "GITHUB_SHA", "NEEDS_JSON")):
        errors.append("safe event/ref/SHA and lane-conclusion diagnostics are required")
    backend = commands(jobs.get("backend-postgresql", {}))
    if not all(token in backend for token in ("docker info", "mvn -B clean verify", "failIfNoTests=true")):
        errors.append("backend must run the explicit Docker/Testcontainers PostgreSQL proof")
    worker = commands(jobs.get("worker", {}))
    if not all(token in worker for token in ("playwright@1.60.0 install", "chromium", "npm run test:coverage", "npm run typecheck", "npm run build")):
        errors.append("worker must provision Chromium and run its complete test/typecheck/build proof")
    return errors


if __name__ == "__main__":
    failures = validate(Path(sys.argv[1]) if len(sys.argv) > 1 else WORKFLOW)
    if failures:
        print("\n".join(f"ERROR: {failure}" for failure in failures), file=sys.stderr)
        raise SystemExit(1)
    print("Required CI contract is valid.")
