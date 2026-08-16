import datetime as dt
import importlib.util
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).parents[1]
SPEC = importlib.util.spec_from_file_location("guard", ROOT / "supply_chain_guard.py")
guard = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(guard)


class SupplyChainGuardTest(unittest.TestCase):
    def setUp(self):
        self.policy = guard.load(ROOT / "policy.json")
        self.today = dt.date(2026, 8, 16)

    def evidence(self, name):
        return guard.load(Path(__file__).parent / "fixtures" / name)

    def exception(self, expires="2026-08-17"):
        return {"exceptions": [{"id": "approved-1", "rule": "sast.injection", "resource": "backend/Fake.java", "owner": "security", "reason": "bounded fixture", "expires": expires}]}

    def test_low_finding_passes_and_high_fails_without_leaking_details(self):
        self.assertEqual("pass", guard.evaluate(self.policy, {"exceptions": []}, self.evidence("pass.json"), self.today)["status"])
        report = guard.evaluate(self.policy, {"exceptions": []}, self.evidence("fail.json"), self.today)
        self.assertEqual("fail", report["status"])
        serialized = json.dumps(report)
        self.assertNotIn("must-not-appear", serialized)
        self.assertNotIn("untrusted confidential source", serialized)

    def test_valid_exception_passes_and_expired_exception_fails(self):
        self.assertEqual("pass", guard.evaluate(self.policy, self.exception(), self.evidence("fail.json"), self.today)["status"])
        expired = guard.evaluate(self.policy, self.exception("2026-08-15"), self.evidence("fail.json"), self.today)
        self.assertEqual("fail", expired["status"])
        self.assertEqual("expired", expired["exception_errors"][0]["error"])

    def test_unavailable_feed_is_not_pass(self):
        self.assertEqual("environment-limitation", guard.evaluate(self.policy, {"exceptions": []}, self.evidence("unavailable.json"), self.today)["status"])

    def test_missing_image_is_not_pass(self):
        evidence = {"scanner_status": "image-unavailable", "findings": []}
        self.assertEqual("environment-limitation", guard.evaluate(self.policy, {"exceptions": []}, evidence, self.today)["status"])

    def test_workflow_actions_are_pinned_to_full_sha(self):
        workflow = (ROOT.parents[2] / ".github/workflows/supply-chain-security.yml").read_text()
        refs = re.findall(r"uses:\s*[^@\s]+@([^\s]+)", workflow)
        self.assertTrue(refs)
        self.assertTrue(all(re.fullmatch(r"[0-9a-f]{40}", ref) for ref in refs))


if __name__ == "__main__":
    unittest.main()
