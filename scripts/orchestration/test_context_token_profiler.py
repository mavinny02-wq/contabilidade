from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from scripts.orchestration.context_token_profiler import TelemetryError, aggregate, parse_event, read_events

FIXTURE = Path(__file__).with_name("tests") / "fixtures" / "token-telemetry" / "events.valid.json"


class TokenOutcomeTelemetryTest(unittest.TestCase):
    def setUp(self) -> None:
        self.events = read_events(FIXTURE)

    def test_reported_and_estimated_are_separate_aggregates(self) -> None:
        report = aggregate(self.events)
        origins = {(row["item"], row["outcome"], row["origin"]) for row in report["aggregates"]}
        self.assertIn(("ITEM-1", "PASS", "PROVIDER_REPORTED"), origins)
        self.assertIn(("ITEM-1", "RERUN", "LOCAL_ESTIMATE"), origins)
        self.assertEqual(3, len(report["aggregates"]))

    def test_sensitive_fields_are_removed_before_persistence(self) -> None:
        raw = json.loads(FIXTURE.read_text(encoding="utf-8"))[0]
        raw["prompt"] = "sensitive prompt"
        raw["secret"] = "credential"
        event = parse_event(raw)
        self.assertNotIn("prompt", event)
        self.assertNotIn("secret", event)
        self.assertEqual(["$.prompt", "$.secret"], event["redactedFields"])
        with self.assertRaisesRegex(TelemetryError, "TOKEN_SENSITIVE_FIELD"):
            parse_event(raw, redact=False)

    def test_duplicate_fingerprint_is_rejected(self) -> None:
        with self.assertRaisesRegex(TelemetryError, "TOKEN_DUPLICATE_FINGERPRINT"):
            aggregate([self.events[0], copy.deepcopy(self.events[0])])

    def test_budget_breach_has_stable_code(self) -> None:
        report = aggregate(self.events, {"ITEM-1": 200, "ITEM-2": 100})
        self.assertEqual([{"code": "TOKEN_BUDGET_BREACH", "item": "ITEM-1", "tokens": 250, "budgetTokens": 200}], report["budgetBreaches"])

    def test_cost_per_outcome_and_unknown_currency_are_distinct(self) -> None:
        report = aggregate(self.events)
        self.assertEqual([{"outcome": "PASS", "currency": "USD", "amount": "0.12"}], report["costPerOutcome"])
        self.assertEqual([{"outcome": "RERUN", "count": 1}], report["unknownCostEvents"])
        self.assertEqual(2, len(report["duplicateContexts"][0]["eventFingerprints"]))

    def test_output_is_deterministic(self) -> None:
        first = json.dumps(aggregate(self.events), sort_keys=True)
        second = json.dumps(aggregate(reversed(self.events)), sort_keys=True)
        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
