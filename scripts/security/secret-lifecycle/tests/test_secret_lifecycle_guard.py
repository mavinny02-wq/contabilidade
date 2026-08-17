import datetime as dt
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).parents[1]
SPEC = importlib.util.spec_from_file_location("secret_lifecycle_guard", ROOT / "secret_lifecycle_guard.py")
guard = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(guard)


class SecretLifecycleGuardTest(unittest.TestCase):
    def setUp(self):
        self.policy = guard.load(ROOT / "policy.json")
        self.inventory = guard.load(ROOT / "inventory.source.json")
        self.today = dt.date(2026, 8, 17)

    def fixture(self, name):
        return guard.load(Path(__file__).parent / "fixtures" / name)

    def rules(self, report):
        return {item["rule"] for item in report["findings"]}

    def test_canonical_inventory_is_byte_identical_twice(self):
        first = guard.canonical_inventory(self.inventory)
        second = guard.canonical_inventory(self.inventory)
        self.assertEqual(first.encode(), second.encode())
        self.assertNotIn("value", first)

    def test_inventory_and_machine_readable_schema_contract(self):
        schema = guard.load(ROOT / "schema.json")
        self.assertEqual(1, schema["properties"]["schemaVersion"]["const"])
        self.assertEqual("PASS", guard.validate(self.inventory, self.policy, {"exceptions": []}, self.today)["status"])

    def test_required_owner_source_and_rotation_policy_fail_closed(self):
        missing = guard.validate(self.fixture("missing-owner.json"), self.policy, {"exceptions": []}, self.today)
        invalid = guard.validate(self.fixture("invalid-source.json"), self.policy, {"exceptions": []}, self.today)
        self.assertIn("REQUIRED_FIELD_OWNER_MISSING", self.rules(missing))
        self.assertIn("SOURCE_TYPE_NOT_ALLOWED", self.rules(invalid))
        for rotation in (0, 366):
            inventory = json.loads(json.dumps(self.inventory))
            inventory["secrets"][0]["rotationDays"] = rotation
            self.assertIn("ROTATION_POLICY_INVALID", self.rules(guard.validate(inventory, self.policy, {"exceptions": []}, self.today)))

    def test_rotation_overdue_and_placeholder_are_rejected(self):
        overdue = guard.validate(self.inventory, self.policy, {"exceptions": []}, self.today, self.fixture("rotation-assessment.json"))
        placeholder = guard.validate(self.inventory, self.policy, {"exceptions": []}, self.today, self.fixture("placeholder-assessment.json"))
        self.assertIn("ROTATION_OVERDUE", self.rules(overdue))
        self.assertIn("PLACEHOLDER_NOT_PROOF", self.rules(placeholder))

    def test_valid_exception_suppresses_rule_and_expired_exception_fails(self):
        exception = {"exceptions": [{"secretId": "fixture.missing-owner", "rule": "REQUIRED_FIELD_OWNER_MISSING", "owner": "security", "reason": "bounded synthetic fixture", "expires": "2026-08-18"}]}
        valid = guard.validate(self.fixture("missing-owner.json"), self.policy, exception, self.today)
        self.assertNotIn("REQUIRED_FIELD_OWNER_MISSING", self.rules(valid))
        exception["exceptions"][0]["expires"] = "2026-08-16"
        self.assertIn("EXCEPTION_EXPIRED", self.rules(guard.validate(self.inventory, self.policy, exception, self.today)))

    def test_findings_are_redacted_and_fingerprinted(self):
        report = guard.validate(self.fixture("redaction.json"), self.policy, {"exceptions": []}, self.today)
        serialized = json.dumps(report)
        self.assertNotIn("SYNTHETIC-MUST-NOT-LEAK", serialized)
        self.assertRegex(report["findings"][0]["fingerprint"], r"^[0-9a-f]{64}$")
        self.assertEqual({"rule", "location", "fingerprint"}, set(report["findings"][0]))


if __name__ == "__main__":
    unittest.main()
