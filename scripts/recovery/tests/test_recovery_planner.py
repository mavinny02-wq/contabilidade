import copy
import json
import unittest
from pathlib import Path

from scripts.recovery.recovery_planner import PlanError, build_plan, validate_manifest, validate_policy

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures"
POLICY = json.loads((ROOT / "recovery-policy.v1.json").read_text())
REFERENCE = "2026-08-17T12:00:00Z"


def fixture(name):
    return json.loads((FIXTURES / name).read_text())


class RecoveryPlannerTest(unittest.TestCase):
    def test_valid_plan_is_byte_deterministic_and_complete(self):
        manifest, target = fixture("valid.json"), fixture("target-safe.json")
        first = build_plan(manifest, target, REFERENCE, "42", POLICY)
        second = build_plan(manifest, target, REFERENCE, "42", POLICY)
        first_bytes = (json.dumps(first, indent=2, sort_keys=True) + "\n").encode()
        second_bytes = (json.dumps(second, indent=2, sort_keys=True) + "\n").encode()
        self.assertEqual(first_bytes, second_bytes)
        self.assertEqual([step["action"] for step in first["steps"]], POLICY["requiredSteps"])
        self.assertEqual(first["rpo"]["seconds"], 86400)
        self.assertEqual(first["rto"]["status"], "TO_BE_MEASURED")
        self.assertEqual(first["mode"], "OFFLINE_PLAN_ONLY")

    def test_invalid_manifest_fixtures_are_rejected(self):
        for name in ("missing-dump.json", "missing-archive.json", "checksum-mismatch.json",
                     "duplicate-component.json"):
            with self.subTest(name=name), self.assertRaises(PlanError):
                validate_manifest(fixture(name))

    def test_incompatible_frontier_is_rejected(self):
        with self.assertRaisesRegex(PlanError, "incompatível"):
            build_plan(fixture("frontier-incompatible.json"), fixture("target-safe.json"),
                       REFERENCE, "42", POLICY)

    def test_stale_backup_is_rejected(self):
        with self.assertRaisesRegex(PlanError, "antiguidade"):
            build_plan(fixture("stale-backup.json"), fixture("target-safe.json"),
                       REFERENCE, "42", POLICY)

    def test_unsafe_target_is_rejected(self):
        with self.assertRaisesRegex(PlanError, "efêmero"):
            build_plan(fixture("valid.json"), fixture("target-unsafe.json"),
                       REFERENCE, "42", POLICY)

    def test_missing_target_contract_is_rejected(self):
        with self.assertRaisesRegex(PlanError, "incompleto"):
            build_plan(fixture("valid.json"), {}, REFERENCE, "42", POLICY)

    def test_invalid_order_fixture_does_not_match_policy(self):
        invalid_policy = copy.deepcopy(POLICY)
        invalid_policy["requiredSteps"] = fixture("order-invalid.json")["requiredSteps"]
        with self.assertRaisesRegex(PlanError, "ordem"):
            validate_policy(invalid_policy)

    def test_findings_do_not_leak_manifest_values(self):
        manifest = fixture("valid.json")
        manifest["databaseDump"]["path"] = "/physical/customer-acme.dump"
        with self.assertRaises(PlanError) as raised:
            validate_manifest(manifest)
        message = str(raised.exception)
        self.assertNotIn("customer", message)
        self.assertNotIn("/physical", message)


if __name__ == "__main__":
    unittest.main()
