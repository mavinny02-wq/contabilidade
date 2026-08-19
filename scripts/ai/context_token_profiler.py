#!/usr/bin/env python3
"""Profile Contabilidade context blocks without claiming provider usage."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

DEFAULT_BUDGET = {
    "agent_rules": 0.12,
    "current_state": 0.08,
    "conversation_history": 0.10,
    "retrieved_docs": 0.15,
    "retrieved_code": 0.35,
    "tool_results": 0.10,
    "user_prompt": 0.05,
}


@dataclass
class BlockProfile:
    category: str
    source: str
    chars: int
    bytes: int
    lines: int
    tokens: int
    token_method: str
    sha256: str


def load_encoder(model: str | None, encoding: str | None):
    try:
        import tiktoken  # type: ignore
    except ImportError:
        return None, "heuristic_chars_div_4"
    try:
        if encoding:
            return tiktoken.get_encoding(encoding), f"tiktoken:{encoding}"
        if model:
            return tiktoken.encoding_for_model(model), f"tiktoken:model:{model}"
    except (KeyError, ValueError):
        pass
    return None, "heuristic_chars_div_4"


def count_tokens(text: str, encoder, method: str) -> tuple[int, str]:
    if encoder is not None:
        return len(encoder.encode(text)), method
    return math.ceil(len(text) / 4), "heuristic_chars_div_4"


def normalized_hash(text: str) -> str:
    return hashlib.sha256(" ".join(text.lower().split()).encode("utf-8")).hexdigest()


def read_block(block: dict[str, Any], root: Path) -> tuple[str, str]:
    if "text" in block:
        return str(block["text"]), str(block.get("source", "inline"))
    if "path" in block:
        path = root / str(block["path"])
        return path.read_text(encoding="utf-8"), str(block.get("source", block["path"]))
    raise ValueError("Each block needs path or text.")


def profile_manifest(manifest: dict[str, Any], root: Path, model: str | None, encoding: str | None) -> dict[str, Any]:
    encoder, method = load_encoder(model, encoding)
    profiles: list[BlockProfile] = []
    duplicates: dict[str, list[str]] = defaultdict(list)

    for block in manifest.get("blocks", []):
        text, source = read_block(block, root)
        tokens, token_method = count_tokens(text, encoder, method)
        digest = normalized_hash(text)
        profile = BlockProfile(
            category=str(block.get("category", "other")),
            source=source,
            chars=len(text),
            bytes=len(text.encode("utf-8")),
            lines=text.count("\n") + 1,
            tokens=tokens,
            token_method=token_method,
            sha256=digest,
        )
        profiles.append(profile)
        duplicates[digest].append(source)

    category_tokens: Counter[str] = Counter()
    for profile in profiles:
        category_tokens[profile.category] += profile.tokens

    provider_usage = manifest.get("provider_usage")
    actual_usage = None
    if isinstance(provider_usage, dict):
        values = {
            key: provider_usage[key]
            for key in (
                "input_tokens", "output_tokens", "cached_input_tokens",
                "reasoning_tokens", "total_tokens",
            )
            if key in provider_usage and provider_usage[key] is not None
        }
        actual_usage = values or None

    warnings: list[dict[str, Any]] = []
    context_limit = manifest.get("context_limit")
    budget = manifest.get("budget", DEFAULT_BUDGET)
    if isinstance(context_limit, int) and context_limit > 0:
        for category, ratio in budget.items():
            used = category_tokens.get(category, 0)
            maximum = math.floor(context_limit * float(ratio))
            if used > maximum:
                warnings.append({"category": category, "tokens": used, "budget_tokens": maximum})

    return {
        "schema_version": 1,
        "timestamp": manifest.get("timestamp"),
        "operation": manifest.get("operation"),
        "workflow": manifest.get("workflow"),
        "agent": manifest.get("agent"),
        "request_id": manifest.get("request_id"),
        "model": model or manifest.get("model"),
        "commit_sha": manifest.get("commit_sha"),
        "duration_ms": manifest.get("duration_ms"),
        "outcome": manifest.get("outcome"),
        "measurement": {
            "block_token_method": profiles[0].token_method if profiles else method,
            "provider_usage_is_actual": bool(actual_usage),
            "provider_usage": actual_usage,
        },
        "blocks": [asdict(profile) for profile in profiles],
        "category_tokens": dict(category_tokens),
        "profiled_input_tokens": sum(category_tokens.values()),
        "duplicate_full_blocks": [
            {"sha256": digest, "sources": sources}
            for digest, sources in duplicates.items() if len(sources) > 1
        ],
        "budget_warnings": warnings,
        "history_messages": manifest.get("history_messages"),
        "tool_calls": manifest.get("tool_calls", []),
        "result_units": manifest.get("result_units", {}),
    }


def render_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# CONTEXT TOKEN PROFILE", "",
        f"Token method: `{report['measurement']['block_token_method']}`",
        "Provider usage: `ACTUAL`" if report["measurement"]["provider_usage_is_actual"] else "Provider usage: `NOT_AVAILABLE`",
        "", "## Input blocks", "",
        "| Category | Source | Tokens | Chars |",
        "|---|---|---:|---:|",
    ]
    for block in report["blocks"]:
        lines.append(f"| {block['category']} | `{block['source']}` | {block['tokens']} | {block['chars']} |")
    lines.extend(["", f"Profiled input total: **{report['profiled_input_tokens']}** tokens"])
    if report["duplicate_full_blocks"]:
        lines.extend(["", "## Exact normalized duplicate blocks", ""])
        for duplicate in report["duplicate_full_blocks"]:
            lines.append("- " + ", ".join(f"`{source}`" for source in duplicate["sources"]))
    if report["budget_warnings"]:
        lines.extend(["", "## Context budget warnings", ""])
        for warning in report["budget_warnings"]:
            lines.append(f"- `{warning['category']}`: {warning['tokens']} > {warning['budget_tokens']}")
    usage = report["measurement"].get("provider_usage")
    if usage:
        lines.extend(["", "## Actual provider usage", ""])
        for key, value in usage.items():
            lines.append(f"- `{key}`: {value}")
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--model")
    parser.add_argument("--encoding")
    parser.add_argument("--json-output", type=Path)
    parser.add_argument("--markdown-output", type=Path)
    parser.add_argument("--append-jsonl", type=Path)
    args = parser.parse_args()

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    report = profile_manifest(manifest, args.repo_root, args.model or manifest.get("model"), args.encoding)
    if args.json_output:
        args.json_output.write_text(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    if args.markdown_output:
        args.markdown_output.write_text(render_markdown(report), encoding="utf-8")
    if args.append_jsonl:
        args.append_jsonl.parent.mkdir(parents=True, exist_ok=True)
        with args.append_jsonl.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(report, ensure_ascii=False, sort_keys=True) + "\n")
    if not any((args.json_output, args.markdown_output, args.append_jsonl)):
        print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
