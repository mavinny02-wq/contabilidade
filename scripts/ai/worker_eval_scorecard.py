#!/usr/bin/env python3
"""Aggregate bounded LLM worker quality/efficiency evidence without model access."""
from __future__ import annotations

import argparse
import json
from decimal import Decimal
from pathlib import Path
from typing import Any, Iterable


TOP_LEVEL_KEYS = {"schemaVersion", "scorecardId", "samples"}
SAMPLE_KEYS = {
    "id",
    "observedAt",
    "provider",
    "model",
    "tier",
    "resultPath",
    "totalTokens",
    "tokenOrigin",
    "latencyMs",
    "providerCost",
    "acceptedCorrection",
    "firstPassAccepted",
    "reviewBlockers",
    "claimsWithoutEvidence",
    "filesOutsideOwner",
    "regressionTests",
    "structuralBuild",
    "unsafeRecommendationRejected",
}
STRING_KEYS = {"id", "observedAt", "provider", "model", "resultPath"}
COUNT_KEYS = {
    "totalTokens",
    "latencyMs",
    "reviewBlockers",
    "claimsWithoutEvidence",
    "filesOutsideOwner",
}
BOOLEAN_KEYS = {
    "acceptedCorrection",
    "firstPassAccepted",
    "unsafeRecommendationRejected",
}
TOKEN_ORIGINS = {"PROVIDER_REPORTED", "LOCAL_ESTIMATE"}
TIERS = {"flash", "pro", "current-codex"}
GATE_STATUSES = {"PASS", "FAIL", "NOT_RUN"}
COST_KEYS = {"amount", "currency", "sourceId"}


class EvalError(ValueError):
    """Fail-closed scorecard validation error."""


def _decimal_text(value: Decimal) -> str:
    normalized = value.normalize()
    return format(normalized, "f")


def _ratio(numerator: int | Decimal, denominator: int) -> str | None:
    if denominator == 0:
        return None
    return _decimal_text(Decimal(numerator) / Decimal(denominator))


def parse_dataset(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict) or set(raw) != TOP_LEVEL_KEYS:
        raise EvalError("EVAL_DATASET_SCHEMA: expected schemaVersion, scorecardId and samples")
    if raw["schemaVersion"] != "1.0":
        raise EvalError("EVAL_SCHEMA_VERSION: expected 1.0")
    if not isinstance(raw["scorecardId"], str) or not raw["scorecardId"]:
        raise EvalError("EVAL_SCORECARD_ID: expected a non-empty string")
    if not isinstance(raw["samples"], list):
        raise EvalError("EVAL_SAMPLES_TYPE: expected an array")

    samples: list[dict[str, Any]] = []
    ids: set[str] = set()
    for index, sample in enumerate(raw["samples"]):
        path = f"$.samples[{index}]"
        if not isinstance(sample, dict) or set(sample) != SAMPLE_KEYS:
            raise EvalError(f"EVAL_SAMPLE_SCHEMA at {path}: unsupported or missing field")
        for key in STRING_KEYS:
            if not isinstance(sample[key], str) or not sample[key]:
                raise EvalError(f"EVAL_STRING_FIELD at {path}.{key}")
        if sample["id"] in ids:
            raise EvalError(f"EVAL_DUPLICATE_ID at {path}.id")
        ids.add(sample["id"])
        for key in COUNT_KEYS:
            value = sample[key]
            if isinstance(value, bool) or not isinstance(value, int) or value < 0:
                raise EvalError(f"EVAL_COUNT_FIELD at {path}.{key}")
        for key in BOOLEAN_KEYS:
            if not isinstance(sample[key], bool):
                raise EvalError(f"EVAL_BOOLEAN_FIELD at {path}.{key}")
        if sample["firstPassAccepted"] and not sample["acceptedCorrection"]:
            raise EvalError(f"EVAL_FIRST_PASS_WITHOUT_ACCEPTANCE at {path}")
        if sample["tokenOrigin"] not in TOKEN_ORIGINS:
            raise EvalError(f"EVAL_TOKEN_ORIGIN at {path}.tokenOrigin")
        if sample["tier"] not in TIERS:
            raise EvalError(f"EVAL_TIER at {path}.tier")
        for key in ("regressionTests", "structuralBuild"):
            if sample[key] not in GATE_STATUSES:
                raise EvalError(f"EVAL_GATE_STATUS at {path}.{key}")
        cost = sample["providerCost"]
        if cost is not None:
            if not isinstance(cost, dict) or set(cost) != COST_KEYS:
                raise EvalError(f"EVAL_COST_SCHEMA at {path}.providerCost")
            try:
                amount = Decimal(str(cost["amount"]))
            except Exception as exc:
                raise EvalError(f"EVAL_COST_AMOUNT at {path}.providerCost.amount") from exc
            if amount < 0:
                raise EvalError(f"EVAL_COST_AMOUNT at {path}.providerCost.amount")
            if not all(isinstance(cost[key], str) and cost[key] for key in ("currency", "sourceId")):
                raise EvalError(f"EVAL_COST_EVIDENCE at {path}.providerCost")
            cost = {**cost, "amount": _decimal_text(amount)}
        samples.append({**sample, "providerCost": cost})
    return {"schemaVersion": "1.0", "scorecardId": raw["scorecardId"], "samples": samples}


def read_dataset(path: Path) -> dict[str, Any]:
    return parse_dataset(json.loads(path.read_text(encoding="utf-8")))


def aggregate(dataset: dict[str, Any]) -> dict[str, Any]:
    parsed = parse_dataset(dataset)
    samples = sorted(parsed["samples"], key=lambda sample: sample["id"])
    accepted = [sample for sample in samples if sample["acceptedCorrection"]]
    reported_accepted = [
        sample for sample in accepted if sample["tokenOrigin"] == "PROVIDER_REPORTED"
    ]
    known_cost = [sample for sample in accepted if sample["providerCost"] is not None]
    currencies = {sample["providerCost"]["currency"] for sample in known_cost}
    complete_cost = len(known_cost) == len(accepted) and len(currencies) == 1 and bool(accepted)
    cost_total = sum(
        (Decimal(sample["providerCost"]["amount"]) for sample in known_cost),
        Decimal(0),
    )
    provider_tokens = sum(sample["totalTokens"] for sample in reported_accepted)
    first_pass = sum(sample["firstPassAccepted"] for sample in accepted)
    regression_pass = sum(sample["regressionTests"] == "PASS" for sample in accepted)
    structural_pass = sum(sample["structuralBuild"] == "PASS" for sample in accepted)

    cost_metric = {
        "status": "AVAILABLE" if complete_cost else "NOT_AVAILABLE",
        "amount": _ratio(cost_total, len(accepted)) if complete_cost else None,
        "currency": next(iter(currencies)) if complete_cost else None,
        "knownAcceptedCorrections": len(known_cost),
        "acceptedCorrections": len(accepted),
    }
    return {
        "schemaVersion": "1.0",
        "scorecardId": parsed["scorecardId"],
        "sampleCount": len(samples),
        "acceptedCorrections": len(accepted),
        "providerReportedTokenCoverage": {
            "knownAcceptedCorrections": len(reported_accepted),
            "acceptedCorrections": len(accepted),
        },
        "providerReportedTokens": provider_tokens,
        "tokensPerAcceptedCorrection": (
            _ratio(provider_tokens, len(accepted))
            if len(reported_accepted) == len(accepted)
            else None
        ),
        "latencyMsPerAcceptedCorrection": _ratio(
            sum(sample["latencyMs"] for sample in accepted), len(accepted)
        ),
        "providerCostPerAcceptedCorrection": cost_metric,
        "firstPassAcceptance": {
            "count": first_pass,
            "acceptedCorrections": len(accepted),
            "rate": _ratio(first_pass, len(accepted)),
        },
        "reviewBlockers": sum(sample["reviewBlockers"] for sample in samples),
        "claimsWithoutEvidence": sum(sample["claimsWithoutEvidence"] for sample in samples),
        "filesOutsideOwner": sum(sample["filesOutsideOwner"] for sample in samples),
        "acceptedWithRegressionTestsPass": regression_pass,
        "acceptedWithStructuralBuildPass": structural_pass,
        "unsafeRecommendationsRejected": sum(
            sample["unsafeRecommendationRejected"] for sample in samples
        ),
        "samples": samples,
    }


def render_markdown(report: dict[str, Any]) -> str:
    cost = report["providerCostPerAcceptedCorrection"]
    cost_text = (
        f"{cost['amount']} {cost['currency']}"
        if cost["status"] == "AVAILABLE"
        else f"NOT_AVAILABLE ({cost['knownAcceptedCorrections']}/{cost['acceptedCorrections']} samples)"
    )
    first_pass = report["firstPassAcceptance"]
    lines = [
        "# Contabilidade worker evaluation scorecard",
        "",
        "**Classification:** `REPRODUCIBLE_WORKER_EVAL_EVIDENCE`",
        "**Dataset:** `scripts/ai/worker_eval_samples.v1.json`",
        "",
        "## Current aggregate",
        "",
        "| Metric | Value |",
        "|---|---:|",
        f"| Accepted corrections | {report['acceptedCorrections']} |",
        f"| Provider-reported tokens | {report['providerReportedTokens']} |",
        f"| Tokens / accepted correction | {report['tokensPerAcceptedCorrection'] or 'NOT_AVAILABLE'} |",
        f"| Latency ms / accepted correction | {report['latencyMsPerAcceptedCorrection'] or 'NOT_AVAILABLE'} |",
        f"| Cost / accepted correction | {cost_text} |",
        f"| First-pass acceptance | {first_pass['count']}/{first_pass['acceptedCorrections']} ({first_pass['rate'] or 'NOT_AVAILABLE'}) |",
        f"| Review blockers | {report['reviewBlockers']} |",
        f"| Claims without evidence | {report['claimsWithoutEvidence']} |",
        f"| Files outside owner | {report['filesOutsideOwner']} |",
        f"| Accepted corrections with regression PASS | {report['acceptedWithRegressionTestsPass']}/{report['acceptedCorrections']} |",
        f"| Accepted corrections with structural build PASS | {report['acceptedWithStructuralBuildPass']}/{report['acceptedCorrections']} |",
        f"| Unsafe recommendations rejected in primary review | {report['unsafeRecommendationsRejected']} |",
        "",
        "## Samples",
        "",
        "| ID | Model | Tokens | Latency ms | First pass | Blockers | Unsupported claims | Outside owner | Tests | Build | Unsafe rejected |",
        "|---|---|---:|---:|---|---:|---:|---:|---|---|---|",
    ]
    for sample in report["samples"]:
        lines.append(
            f"| `{sample['id']}` | `{sample['model']}` | {sample['totalTokens']} | "
            f"{sample['latencyMs']} | {'yes' if sample['firstPassAccepted'] else 'no'} | "
            f"{sample['reviewBlockers']} | {sample['claimsWithoutEvidence']} | "
            f"{sample['filesOutsideOwner']} | {sample['regressionTests']} | "
            f"{sample['structuralBuild']} | "
            f"{'yes' if sample['unsafeRecommendationRejected'] else 'no'} |"
        )
    lines.extend(
        [
            "",
            "## Metric definitions",
            "",
            "- `first-pass acceptance`: the primary reviewer accepted the worker recommendation without a required correction.",
            "- `review blockers`: actionable blockers confirmed by the primary reviewer, including a risk-bearing recommendation that was rejected.",
            "- `claims without evidence`: assertions the primary review could not support from the bounded source or gate output.",
            "- `files outside owner`: files inspected or changed outside the launcher boundary.",
            "- test/build PASS values come from the linked RESULT_MD, never from the worker's own claim.",
            "",
            "## Interpretation boundaries",
            "",
            "- The token counts are provider-reported totals copied from the two worker footers; prompts and responses are not persisted.",
            "- Cost is `NOT_AVAILABLE`, not zero: neither sample returned a billed amount and no versioned price table was applied.",
            "- There is no equivalent OpenAI sample, so this scorecard makes no provider cost or quality comparison.",
            "- A correction is accepted only after primary review and green recorded gates; worker output never self-accepts.",
            "",
            "## Adding a sample",
            "",
            "1. Add one object to `scripts/ai/worker_eval_samples.v1.json`; never store prompt, response, source text, secret or PII.",
            "2. Use `PROVIDER_REPORTED` only for a provider/footer counter; otherwise mark the sample `LOCAL_ESTIMATE`.",
            "3. Record cost only with a billed amount or versioned price-table `sourceId`; unknown cost remains `null`.",
            "4. Record first-pass acceptance, review blockers, unsupported claims, owner drift and gate results from the primary RESULT_MD.",
            "5. Regenerate this file with the command below and commit dataset, scorecard and RESULT_MD together.",
            "",
            "```text",
            "python scripts/ai/worker_eval_scorecard.py scripts/ai/worker_eval_samples.v1.json --markdown-output docs/ai/CONTABILIDADE_WORKER_EVAL_SCORECARD.md",
            "```",
            "",
            "`CONTABILIDADE_WORKER_EVAL_SCORECARD_V1`",
        ]
    )
    return "\n".join(lines) + "\n"


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", type=Path)
    parser.add_argument("--json-output", type=Path)
    parser.add_argument("--markdown-output", type=Path)
    args = parser.parse_args(list(argv) if argv is not None else None)
    try:
        report = aggregate(read_dataset(args.dataset))
    except (OSError, json.JSONDecodeError, EvalError) as exc:
        parser.exit(2, f"WORKER_EVAL_ERROR: {exc}\n")
    if args.json_output:
        args.json_output.write_text(
            json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    if args.markdown_output:
        args.markdown_output.write_text(render_markdown(report), encoding="utf-8")
    if not args.json_output and not args.markdown_output:
        print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
