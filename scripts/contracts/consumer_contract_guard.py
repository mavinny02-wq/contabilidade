#!/usr/bin/env python3
"""Inventory frontend HTTP call sites and validate their OpenAPI consumer contract."""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys
from typing import Any

CALL = re.compile(r"\b(api(?:<[^;()]*?>)?|baixarArquivo)\s*\(")
STRING = re.compile(r"^([`'\"])(.*)\1$", re.S)


def _balanced(source: str, start: int) -> tuple[str, int]:
    depth, quote, escaped = 1, None, False
    for index in range(start, len(source)):
        char = source[index]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
        elif char in "'\"`":
            quote = char
        elif char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return source[start:index], index
    raise ValueError("unclosed HTTP helper call")


def _split(expression: str, delimiter: str = ",") -> list[str]:
    parts, start, depths, quote, escaped = [], 0, [0, 0, 0], None, False
    pairs = {"(": (0, 1), ")": (0, -1), "[": (1, 1), "]": (1, -1), "{": (2, 1), "}": (2, -1)}
    for index, char in enumerate(expression):
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
        elif char in "'\"`":
            quote = char
        elif char in pairs:
            slot, change = pairs[char]
            depths[slot] += change
        elif char == delimiter and not any(depths):
            parts.append(expression[start:index].strip())
            start = index + 1
    parts.append(expression[start:].strip())
    return parts


def _conditional_values(expression: str) -> list[str]:
    expression = expression.strip()
    if STRING.match(expression):
        return [expression]
    # Consumer paths and methods use simple ternaries; retain both concrete branches.
    match = re.search(r"\?\s*([^:]+?)\s*:\s*(.+)$", expression, re.S)
    return [match.group(1).strip(), match.group(2).strip()] if match else [expression]


def _placeholder(value: str) -> str:
    value = re.sub(r"^encodeURIComponent\((.*)\)$", r"\1", value.strip())
    name = value.split(".")[-1].strip()
    return name if re.fullmatch(r"[A-Za-z_$][\w$]*", name) else "value"


def _path(expression: str) -> str | None:
    match = STRING.match(expression.strip())
    if not match:
        return None
    raw = re.sub(r"\$\{\s*\w+\s*\?\s*`\?\$\{\w+\}`\s*:\s*''\s*}", "", match.group(2))
    value = re.sub(r"\$\{([^}]+)\}", lambda item: "{" + _placeholder(item.group(1)) + "}", raw)
    value = value.split("?", 1)[0]
    if value.endswith("{query}"):
        value = value[:-7]
    return "/api" + value if value.startswith("/") and not value.startswith("/api/") else value


def inventory(frontend: pathlib.Path) -> dict[str, Any]:
    entries: list[dict[str, Any]] = []
    for file in sorted(frontend.rglob("*.ts*")):
        if file.name.endswith(".test.ts") or file.name.endswith(".test.tsx") or file.name == "http.ts":
            continue
        source = file.read_text(encoding="utf-8")
        for match in CALL.finditer(source):
            arguments, _ = _balanced(source, match.end())
            args = _split(arguments)
            helper = match.group(1)
            path_expressions = _conditional_values(args[0])
            if len(path_expressions) == 1 and not STRING.match(path_expressions[0]):
                name = path_expressions[0].strip()
                assignment = list(re.finditer(rf"\bconst\s+{re.escape(name)}\s*=\s*(.*?);", source[:match.start()], re.S))
                if assignment:
                    path_expressions = _conditional_values(assignment[-1].group(1))
            init = args[1] if len(args) > 1 else ""
            method_match = re.search(r"\bmethod\s*:\s*([^,}\n]+)", init)
            methods = [item.strip(" '\"").upper() for item in _conditional_values(method_match.group(1))] if method_match else ["GET"]
            paths = [_path(item) for item in path_expressions]
            if any(path is None for path in paths):
                raise ValueError(f"dynamic_path_not_resolved:{file}:{source.count(chr(10), 0, match.start()) + 1}")
            if len(paths) == len(methods):
                pairs = zip(paths, methods)
            elif len(methods) == 1:
                pairs = ((path, methods[0]) for path in paths)
            else:
                raise ValueError(f"conditional_method_path_mismatch:{file}")
            for path, method in pairs:
                entries.append({
                    "file": file.as_posix(),
                    "line": source.count("\n", 0, match.start()) + 1,
                    "method": method,
                    "path": path,
                    "requestBody": "body" in init,
                    "responseMode": "blob" if helper == "baixarArquivo" else ("none" if "api<void>" in helper else "json"),
                })
    entries.sort(key=lambda item: (item["file"], item["line"], item["method"], item["path"]))
    return {"schemaVersion": 1, "callSites": entries}


def _operations(openapi: dict[str, Any]) -> dict[tuple[str, str], dict[str, Any]]:
    methods = {"get", "post", "put", "patch", "delete", "head", "options", "trace"}
    return {(method.upper(), path): operation for path, item in openapi.get("paths", {}).items()
            for method, operation in item.items() if method in methods}


def _route_shape(path: str) -> str:
    return re.sub(r"\{[^}]+}", "{}", path)


def validate(data: dict[str, Any], usage: dict[str, Any], openapi: dict[str, Any]) -> list[str]:
    errors, operations = [], _operations(openapi)
    actual = {(item["method"], item["path"]) for item in data["callSites"]}
    mapped = {(item["method"], item["path"]) for item in usage["operations"]}
    errors += [f"call_site_unmapped:{method} {path}" for method, path in sorted(actual - mapped)]
    errors += [f"usage_without_call_site:{method} {path}" for method, path in sorted(mapped - actual)]
    for item in usage["operations"]:
        key = item["method"], item["path"]
        operation = operations.get(key)
        if not operation:
            matches = [candidate for (method, path), candidate in operations.items()
                       if method == key[0] and _route_shape(path) == _route_shape(key[1])]
            operation = matches[0] if len(matches) == 1 else None
        if not operation:
            errors.append(f"operation_missing_or_method_mismatch:{key[0]} {key[1]}")
            continue
        if operation.get("operationId") != item["operationId"]:
            errors.append(f"operation_id_mismatch:{key[0]} {key[1]}")
        calls = [call for call in data["callSites"] if (call["method"], call["path"]) == key]
        parameters = operation.get("parameters", [])
        required_path_count = sum(1 for parameter in parameters if parameter.get("in") == "path" and parameter.get("required"))
        if required_path_count > len(re.findall(r"\{[^}]+}", key[1])):
            errors.append(f"required_path_parameter_missing:{key[0]} {key[1]}")
        if operation.get("requestBody", {}).get("required") and calls and not all(call["requestBody"] for call in calls):
            errors.append(f"required_request_body_missing:{key[0]} {key[1]}")
        responses = operation.get("responses", {})
        for status in item.get("successStatuses", []):
            if status not in responses:
                errors.append(f"consumed_response_missing:{key[0]} {key[1]}:{status}")
    return sorted(set(errors))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--frontend", required=True, type=pathlib.Path)
    parser.add_argument("--output", type=pathlib.Path)
    parser.add_argument("--usage", type=pathlib.Path)
    parser.add_argument("--openapi", type=pathlib.Path)
    args = parser.parse_args()
    try:
        data = inventory(args.frontend)
        if args.output:
            args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        if args.usage and args.openapi:
            errors = validate(data, json.loads(args.usage.read_text()), json.loads(args.openapi.read_text()))
            if errors:
                print("CONSUMER_CONTRACT_FAILED\n" + "\n".join(errors), file=sys.stderr)
                return 1
        print("CONSUMER_CONTRACT_OK")
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"CONSUMER_CONTRACT_ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
