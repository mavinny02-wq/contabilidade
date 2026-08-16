#!/usr/bin/env python3
"""Profile context blocks; estimates never masquerade as provider telemetry."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from collections import Counter, defaultdict
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


def count_tokens(text: str) -> tuple[int, str]:
    return math.ceil(len(text) / 4), "heuristic_chars_div_4"


def read_block(block: dict[str, Any], root: Path) -> tuple[str, str]:
    if "text" in block:
        return str(block["text"]), str(block.get("source", "inline"))
    if "path" in block:
        path = root / str(block["path"])
        return path.read_text(encoding="utf-8"), str(block.get("source", block["path"]))
    raise ValueError("Each block needs text or path.")


def profile(manifest: dict[str, Any], root: Path) -> dict[str, Any]:
    blocks = []
    categories: Counter[str] = Counter()
    duplicates: dict[str, list[str]] = defaultdict(list)
    for block in manifest.get("blocks", []):
        text, source = read_block(block, root)
        tokens, method = count_tokens(text)
        normalized = " ".join(text.lower().split())
        digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        category = str(block.get("category", "other"))
        row = {
            "category": category,
            "source": source,
            "characters": len(text),
            "lines": text.count("\n") + 1,
            "tokens": tokens,
            "token_method": method,
            "sha256": digest,
        }
        blocks.append(row)
        categories[category] += tokens
        duplicates[digest].append(source)

    usage = manifest.get("provider_usage")
    actual = None
    if isinstance(usage, dict):
        actual = {key: value for key, value in usage.items() if value is not None}

    warnings = []
    limit = manifest.get("context_limit")
    budget = manifest.get("budget", DEFAULT_BUDGET)
    if isinstance(limit, int) and limit > 0:
        for category, ratio in budget.items():
            used = categories.get(category, 0)
            cap = math.floor(limit * float(ratio))
            if used > cap:
                warnings.append({"category": category, "tokens": used, "budget_tokens": cap})

    return {
        "schema_version": 1,
        "operation": manifest.get("operation"),
        "workflow": manifest.get("workflow"),
        "model": manifest.get("model"),
        "measurement": {
            "block_token_method": "heuristic_chars_div_4",
            "provider_usage_is_actual": bool(actual),
            "provider_usage": actual,
        },
        "blocks": blocks,
        "category_tokens": dict(categories),
        "profiled_input_tokens": sum(categories.values()),
        "duplicate_full_blocks": [
            {"sha256": digest, "sources": sources}
            for digest, sources in duplicates.items()
            if len(sources) > 1
        ],
        "budget_warnings": warnings,
        "outcome": manifest.get("outcome"),
        "result_units": manifest.get("result_units", {}),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--json-output", type=Path)
    parser.add_argument("--append-jsonl", type=Path)
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    report = profile(manifest, args.repo_root)
    text = json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if args.json_output:
        args.json_output.write_text(text, encoding="utf-8")
    if args.append_jsonl:
        args.append_jsonl.parent.mkdir(parents=True, exist_ok=True)
        with args.append_jsonl.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(report, ensure_ascii=False, sort_keys=True) + "\n")
    if not args.json_output and not args.append_jsonl:
        print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
