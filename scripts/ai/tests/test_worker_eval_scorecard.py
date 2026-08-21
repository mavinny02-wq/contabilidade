from __future__ import annotations

import copy
import importlib.util
import json
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "worker_eval_scorecard.py"
DATASET_PATH = Path(__file__).parents[1] / "worker_eval_samples.v1.json"
spec = importlib.util.spec_from_file_location("worker_eval_scorecard", MODULE_PATH)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
assert spec.loader
spec.loader.exec_module(module)


class WorkerEvalScorecardTest(unittest.TestCase):
    def setUp(self) -> None:
        self.dataset = json.loads(DATASET_PATH.read_text(encoding="utf-8"))

    def test_observed_scorecard_is_aggregated_honestly(self) -> None:
        report = module.aggregate(self.dataset)
        self.assertEqual(2, report["acceptedCorrections"])
        self.assertEqual(25465, report["providerReportedTokens"])
        self.assertEqual("12732.5", report["tokensPerAcceptedCorrection"])
        self.assertEqual("63500", report["latencyMsPerAcceptedCorrection"])
        self.assertEqual(3, report["reviewBlockers"])
        self.assertEqual(0, report["claimsWithoutEvidence"])
        self.assertEqual(0, report["filesOutsideOwner"])
        self.assertEqual(1, report["unsafeRecommendationsRejected"])
        self.assertEqual(2, report["acceptedWithRegressionTestsPass"])
        self.assertEqual(2, report["acceptedWithStructuralBuildPass"])

    def test_unknown_cost_is_not_reported_as_zero(self) -> None:
        cost = module.aggregate(self.dataset)["providerCostPerAcceptedCorrection"]
        self.assertEqual("NOT_AVAILABLE", cost["status"])
        self.assertIsNone(cost["amount"])
        self.assertIsNone(cost["currency"])
        self.assertEqual(0, cost["knownAcceptedCorrections"])

    def test_complete_same_currency_cost_evidence_is_aggregated(self) -> None:
        dataset = copy.deepcopy(self.dataset)
        dataset["samples"][0]["providerCost"] = {
            "amount": "0.10", "currency": "USD", "sourceId": "invoice-a"
        }
        dataset["samples"][1]["providerCost"] = {
            "amount": "0.30", "currency": "USD", "sourceId": "invoice-b"
        }
        cost = module.aggregate(dataset)["providerCostPerAcceptedCorrection"]
        self.assertEqual("AVAILABLE", cost["status"])
        self.assertEqual("0.2", cost["amount"])
        self.assertEqual("USD", cost["currency"])

    def test_unknown_or_sensitive_fields_fail_closed(self) -> None:
        dataset = copy.deepcopy(self.dataset)
        dataset["samples"][0]["prompt"] = "must never persist"
        with self.assertRaisesRegex(module.EvalError, "EVAL_SAMPLE_SCHEMA"):
            module.parse_dataset(dataset)

    def test_first_pass_cannot_be_true_without_accepted_correction(self) -> None:
        dataset = copy.deepcopy(self.dataset)
        dataset["samples"][0]["acceptedCorrection"] = False
        dataset["samples"][0]["firstPassAccepted"] = True
        with self.assertRaisesRegex(module.EvalError, "EVAL_FIRST_PASS_WITHOUT_ACCEPTANCE"):
            module.parse_dataset(dataset)

    def test_output_is_deterministic_across_sample_order(self) -> None:
        reversed_dataset = copy.deepcopy(self.dataset)
        reversed_dataset["samples"].reverse()
        first = json.dumps(module.aggregate(self.dataset), sort_keys=True)
        second = json.dumps(module.aggregate(reversed_dataset), sort_keys=True)
        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
