import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("artifact_budget.py")


class ArtifactBudgetTest(unittest.TestCase):
    def run_guard(self, policy, current):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "policy.json").write_text(json.dumps(policy))
            (root / "current.json").write_text(json.dumps(current))
            return subprocess.run([sys.executable, SCRIPT, "guard", "--policy", root / "policy.json", "--current", root / "current.json"], capture_output=True, text=True)

    @staticmethod
    def policy(baseline=100, exceptions=None):
        return {"components": {"sample": {"metrics": {"bytes": {"baseline": baseline, "tolerance": 5, "max_growth_ratio": 0}}}}, "exceptions": exceptions or []}

    @staticmethod
    def current(value=100, component="sample"):
        return {"components": {component: {"metrics": {"bytes": value}}}}

    def test_valid_baseline_growth_within_tolerance_and_reduction(self):
        for value in (100, 105, 50):
            with self.subTest(value=value):
                self.assertEqual(0, self.run_guard(self.policy(), self.current(value)).returncode)

    def test_growth_is_blocked(self):
        self.assertNotEqual(0, self.run_guard(self.policy(), self.current(106)).returncode)

    def test_missing_artifact_and_new_component_without_baseline(self):
        self.assertNotEqual(0, self.run_guard(self.policy(), {"components": {}}).returncode)
        current = self.current()
        current["components"]["new"] = {"metrics": {"bytes": 1}}
        self.assertNotEqual(0, self.run_guard(self.policy(), current).returncode)

    def test_valid_and_expired_exception(self):
        base = {"component": "sample", "metric": "bytes", "owner": "perf-owner", "reason": "bounded rollout"}
        valid = dict(base, expires="2999-01-01")
        expired = dict(base, expires="2000-01-01")
        self.assertEqual(0, self.run_guard(self.policy(exceptions=[valid]), self.current(106)).returncode)
        self.assertNotEqual(0, self.run_guard(self.policy(exceptions=[expired]), self.current(106)).returncode)

    def test_non_reproducible_measurements(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name, value in (("first", 100), ("second", 101)):
                (root / f"{name}.json").write_text(json.dumps(self.current(value)))
            result = subprocess.run([sys.executable, SCRIPT, "reproducible", "--first", root / "first.json", "--second", root / "second.json"], capture_output=True, text=True)
            self.assertNotEqual(0, result.returncode)


if __name__ == "__main__":
    unittest.main()
