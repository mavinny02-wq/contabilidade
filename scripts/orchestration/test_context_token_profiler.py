from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from scripts.orchestration.context_token_profiler import TelemetryError, aggregate, parse_event, parse_policy, read_events

FIXTURE = Path(__file__).with_name("tests") / "fixtures" / "token-telemetry" / "events.valid.json"
POLICY = Path(__file__).with_name("task-budget-policy.v1.json")


class TokenOutcomeTelemetryTest(unittest.TestCase):
    def setUp(self) -> None:
        self.events = read_events(FIXTURE)
        self.policy = parse_policy(json.loads(POLICY.read_text(encoding="utf-8")))

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

    def test_exact_hard_limit_is_warning_not_breach(self) -> None:
        event = copy.deepcopy(self.events[0])
        event["inputTokens"] = self.policy["classes"]["IMPLEMENTATION"]["inputTokens"]["hard"]
        event["fingerprint"] = parse_event({k: v for k, v in event.items() if k != "fingerprint"})["fingerprint"]
        self.assertEqual("BUDGET_WARNING", aggregate([event], self.policy)["budgetResults"][0]["status"])

    def test_warning_breach_and_policy_missing_are_distinct(self) -> None:
        warning = copy.deepcopy(self.events[0]); warning["inputTokens"] = 25000
        breach = copy.deepcopy(self.events[1]); breach["outputTokens"] = 10001
        breach.pop("cost", None)
        for event in (warning, breach):
            event.pop("fingerprint", None); event.update(parse_event(event))
        report = aggregate([warning, breach], self.policy)
        self.assertEqual({"BUDGET_WARNING", "BUDGET_BREACH"}, {row["status"] for row in report["budgetResults"]})
        missing_policy = copy.deepcopy(self.policy); del missing_policy["classes"]["VALIDATION"]
        self.assertEqual("BUDGET_POLICY_MISSING", aggregate([self.events[2]], missing_policy)["budgetResults"][0]["status"])

    def test_missing_currency_is_policy_missing_not_zero_cost(self) -> None:
        report = aggregate([self.events[1]], self.policy)
        self.assertEqual("BUDGET_POLICY_MISSING", report["budgetResults"][0]["status"])
        self.assertEqual("CURRENCY_POLICY_MISSING", report["budgetResults"][0]["deviations"][0]["reason"])

    def test_cost_per_outcome_and_unknown_currency_are_distinct(self) -> None:
        report = aggregate(self.events)
        self.assertEqual([{"outcome": "PASS", "currency": "USD", "amount": "0.12"}], report["costPerOutcome"])
        self.assertEqual([{"outcome": "RERUN", "count": 1}], report["unknownCostEvents"])
        self.assertEqual(2, len(report["duplicateContexts"][0]["eventFingerprints"]))

    def test_output_is_deterministic(self) -> None:
        first = json.dumps(aggregate(self.events, self.policy), sort_keys=True)
        second = json.dumps(aggregate(reversed(self.events), self.policy), sort_keys=True)
        self.assertEqual(first, second)

    def test_previous_event_without_task_class_is_explicitly_incompatible(self) -> None:
        raw = json.loads(FIXTURE.read_text(encoding="utf-8"))[0]
        del raw["taskClass"]
        with self.assertRaisesRegex(TelemetryError, "TOKEN_REQUIRED_FIELD.*taskClass"):
            parse_event(raw)


if __name__ == "__main__":
    unittest.main()
