import copy
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).parents[1] / "iam_guard.py"
SPEC = importlib.util.spec_from_file_location("iam_guard", MODULE_PATH)
guard = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
sys.modules[SPEC.name] = guard
SPEC.loader.exec_module(guard)


class IamGuardTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = guard.inventory()
        cls.policy = json.loads(guard.POLICY.read_text(encoding="utf-8"))
        cls.cases = json.loads((Path(__file__).parent / "fixtures/drift_cases.json").read_text(encoding="utf-8"))

    def codes(self, data=None, policy=None):
        return {item.code for item in guard.validate(data or self.data, policy or self.policy)}

    def test_fixture_catalog_covers_required_drift(self):
        self.assertEqual(
            {"missing_role", "orphan_permission", "new_public_route", "unknown_authority", "malformed_claim", "duplicate", "realm_divergence"},
            {item["case"] for item in self.cases},
        )

    def test_role_and_realm_drift(self):
        data = copy.deepcopy(self.data)
        data["realms"][0]["roles"].remove("contabilidade_admin")
        data["realms"][1]["roles"].append("synthetic_unmapped_role")
        data["roles"].append(copy.deepcopy(data["roles"][0]))
        self.assertTrue({"MISSING_REALM_ROLE", "UNMAPPED_REALM_ROLE", "DUPLICATE_ROLE"} <= self.codes(data))

    def test_permission_drift(self):
        data = copy.deepcopy(self.data)
        data["permission_uses"].append({"file": "synthetic/Controller.java", "permissions": ["SYNTHETIC_UNKNOWN"]})
        self.assertIn("UNKNOWN_PERMISSION", self.codes(data))

    def test_malformed_claim_contract_drift(self):
        data = copy.deepcopy(self.data)
        data["jwt"]["accepted_claims"] = ["synthetic.untrusted.claim"]
        self.assertIn("JWT_CLAIM_DRIFT", self.codes(data))

    def test_public_route_and_protected_fallback_drift(self):
        data = copy.deepcopy(self.data)
        data["public_routes"].append({"method": "*", "path": "/synthetic/public"})
        self.assertIn("UNEXPECTED_PUBLIC_ROUTE", self.codes(data))

    def test_realm_inventory_matches_explicit_mapping(self):
        expected = set(self.policy["realm_role_mapping"])
        for realm in self.data["realms"]:
            self.assertEqual(expected, set(realm["roles"]))

    def test_worker_never_receives_user_authority(self):
        policy = copy.deepcopy(self.policy)
        policy["worker"]["user_authorities"] = ["ROLE_ADMIN"]
        self.assertIn("WORKER_USER_AUTHORITY", self.codes(policy=policy))

    def test_inventory_is_byte_deterministic(self):
        with tempfile.TemporaryDirectory() as directory:
            first = Path(directory) / "first.json"
            second = Path(directory) / "second.json"
            guard.write_inventory(first, guard.inventory())
            guard.write_inventory(second, guard.inventory())
            self.assertEqual(first.read_bytes(), second.read_bytes())

    def test_findings_redact_source_content(self):
        data = copy.deepcopy(self.data)
        secret_marker = "synthetic secret value@example.invalid"
        data["permission_uses"].append({"file": "synthetic/Controller.java", "permissions": [secret_marker]})
        output = json.dumps([item.__dict__ for item in guard.validate(data, self.policy)])
        self.assertNotIn(secret_marker, output)
        self.assertNotIn("realm_access.roles", output)

    def test_unknown_authority_is_reported_without_claim_value(self):
        data = copy.deepcopy(self.data)
        data["jwt"]["unknown_role_policy"] = "passthrough"
        findings = guard.validate(data, self.policy)
        unknown = [item for item in findings if item.code == "UNKNOWN_AUTHORITY_ACCEPTED"]
        self.assertEqual(1, len(unknown))
        self.assertNotIn("realm_access", unknown[0].detail)


if __name__ == "__main__":
    unittest.main()
