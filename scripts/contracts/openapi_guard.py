#!/usr/bin/env python3
"""Normalize OpenAPI documents and reject incompatible API changes."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import sys
import urllib.request
from typing import Any

HTTP_METHODS = {"get", "put", "post", "delete", "patch", "options", "head", "trace"}


def load(source: str) -> dict[str, Any]:
    if source.startswith(("http://", "https://")):
        try:
            with urllib.request.urlopen(source, timeout=20) as response:
                if response.status != 200:
                    raise RuntimeError(f"HTTP {response.status}")
                return json.load(response)
        except Exception as exc:
            raise RuntimeError(f"backend OpenAPI unavailable at {source}: {exc}") from exc
    with open(source, encoding="utf-8") as stream:
        return json.load(stream)


def normalize(document: dict[str, Any]) -> dict[str, Any]:
    result = json.loads(json.dumps(document))
    result.pop("servers", None)
    result.get("info", {}).pop("x-generated-at", None)
    for path, item in result.get("paths", {}).items():
        visibility = "internal" if path.startswith("/api/interno/") else "public"
        for method, operation in item.items():
            if method in HTTP_METHODS and isinstance(operation, dict):
                operation["x-contabilidade-visibility"] = visibility
    return result


def write_normalized(document: dict[str, Any], destination: str) -> None:
    pathlib.Path(destination).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(destination).write_text(
        json.dumps(normalize(document), ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def _type(schema: dict[str, Any]) -> tuple[Any, Any]:
    return schema.get("type"), schema.get("format")


def _schema_changes(old: dict[str, Any], new: dict[str, Any], at: str, changes: list[str]) -> None:
    if _type(old) != _type(new):
        changes.append(f"schema_type_changed:{at}")
    old_enum, new_enum = old.get("enum"), new.get("enum")
    if old_enum and new_enum and not set(old_enum).issubset(new_enum):
        changes.append(f"enum_narrowed:{at}")
    for name, prop in old.get("properties", {}).items():
        if name not in new.get("properties", {}):
            changes.append(f"property_removed:{at}.{name}")
        else:
            _schema_changes(prop, new["properties"][name], f"{at}.{name}", changes)
    old_required = set(old.get("required", []))
    new_required = set(new.get("required", []))
    for name in sorted(new_required - old_required):
        changes.append(f"property_became_required:{at}.{name}")


def _content_changes(old: dict[str, Any], new: dict[str, Any], at: str, changes: list[str]) -> None:
    for media_type, media in old.get("content", {}).items():
        if media_type not in new.get("content", {}):
            changes.append(f"media_type_removed:{at}:{media_type}")
        else:
            _schema_changes(media.get("schema", {}), new["content"][media_type].get("schema", {}), at, changes)


def breaking_changes(old: dict[str, Any], new: dict[str, Any]) -> list[str]:
    changes: list[str] = []
    for path, old_item in old.get("paths", {}).items():
        if path not in new.get("paths", {}):
            changes.append(f"path_removed:{path}")
            continue
        for method, old_op in old_item.items():
            if method not in HTTP_METHODS:
                continue
            new_op = new["paths"][path].get(method)
            loc = f"{method.upper()} {path}"
            if not new_op:
                changes.append(f"method_removed:{loc}")
                continue
            if old_op.get("operationId") != new_op.get("operationId"):
                changes.append(f"operation_id_changed:{loc}")
            old_security = old_op.get("security", old.get("security"))
            new_security = new_op.get("security", new.get("security"))
            if old_security and not new_security:
                changes.append(f"authorization_relaxed:{loc}")
            old_params = {(p.get("name"), p.get("in")): p for p in old_op.get("parameters", [])}
            new_params = {(p.get("name"), p.get("in")): p for p in new_op.get("parameters", [])}
            for key, parameter in new_params.items():
                if key not in old_params and parameter.get("required"):
                    changes.append(f"required_parameter_added:{loc}:{key[1]}:{key[0]}")
            for key, parameter in old_params.items():
                if key in new_params and _type(parameter.get("schema", {})) != _type(new_params[key].get("schema", {})):
                    changes.append(f"parameter_type_changed:{loc}:{key[1]}:{key[0]}")
            old_body, new_body = old_op.get("requestBody", {}), new_op.get("requestBody", {})
            if not old_body.get("required") and new_body.get("required"):
                changes.append(f"request_body_became_required:{loc}")
            _content_changes(old_body, new_body, f"request:{loc}", changes)
            for status, old_response in old_op.get("responses", {}).items():
                if status not in new_op.get("responses", {}):
                    changes.append(f"response_removed:{loc}:{status}")
                else:
                    _content_changes(old_response, new_op["responses"][status], f"response:{loc}:{status}", changes)
    old_schemas = old.get("components", {}).get("schemas", {})
    new_schemas = new.get("components", {}).get("schemas", {})
    for name, schema in old_schemas.items():
        if name not in new_schemas:
            changes.append(f"schema_removed:{name}")
        else:
            _schema_changes(schema, new_schemas[name], name, changes)
    return sorted(set(changes))


def operation_ids(document: dict[str, Any]) -> set[str]:
    return {
        operation["operationId"]
        for item in document.get("paths", {}).values()
        for method, operation in item.items()
        if method in HTTP_METHODS and operation.get("operationId")
    }


def validate_usage(document: dict[str, Any], usage_file: str) -> list[str]:
    usage = json.loads(pathlib.Path(usage_file).read_text(encoding="utf-8"))
    available = operation_ids(document)
    return [f"frontend_operation_missing:{item['operationId']}" for item in usage["operations"] if item["operationId"] not in available]


def apply_exceptions(changes: list[str], exceptions_file: str | None, today: dt.date | None = None) -> tuple[list[str], list[str]]:
    if not exceptions_file:
        return changes, []
    entries = json.loads(pathlib.Path(exceptions_file).read_text(encoding="utf-8")).get("exceptions", [])
    current = today or dt.date.today()
    waived, errors = set(), []
    for entry in entries:
        required = ("change", "owner", "reason", "transitionVersion", "expiresOn")
        if any(not entry.get(key) for key in required):
            errors.append("invalid_exception:missing_required_metadata")
            continue
        try:
            expires = dt.date.fromisoformat(entry["expiresOn"])
        except ValueError:
            errors.append(f"invalid_exception:bad_expiry:{entry['change']}")
            continue
        if expires < current:
            errors.append(f"expired_exception:{entry['change']}")
        else:
            waived.add(entry["change"])
    return [change for change in changes if change not in waived], errors


def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    generate = sub.add_parser("generate")
    generate.add_argument("--source", required=True)
    generate.add_argument("--output", required=True)
    check = sub.add_parser("check")
    check.add_argument("--baseline", required=True)
    check.add_argument("--candidate", required=True)
    check.add_argument("--usage-map")
    check.add_argument("--exceptions")
    args = parser.parse_args()
    try:
        if args.command == "generate":
            write_normalized(load(args.source), args.output)
            return 0
        baseline, candidate = normalize(load(args.baseline)), normalize(load(args.candidate))
        changes = breaking_changes(baseline, candidate)
        if args.usage_map:
            changes += validate_usage(candidate, args.usage_map)
        changes, exception_errors = apply_exceptions(changes, args.exceptions)
        errors = sorted(changes + exception_errors)
        if errors:
            print("OPENAPI_COMPATIBILITY_FAILED", file=sys.stderr)
            print("\n".join(errors), file=sys.stderr)
            return 1
        print("OPENAPI_COMPATIBILITY_OK")
        return 0
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
        print(f"OPENAPI_GUARD_ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
