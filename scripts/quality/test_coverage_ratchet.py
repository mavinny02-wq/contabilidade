import copy
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("coverage_ratchet.py")


def contract(percent=50.0, completeness="COMPLETE", limitations=None):
    return {
        "schemaVersion": 1,
        "baselineSha": "c3c06e8cb5921f96ecdb9b1e397594d01dd4430f",
        "tolerance": {"percentagePoints": 0.01, "basis": "two identical measurements"},
        "exceptions": [],
        "components": [{
            "component": "sample", "command": "test", "toolchain": "test",
            "completeness": completeness, "limitations": limitations or [],
            "metrics": {"lines": {"covered": int(percent), "total": 100, "percent": percent}},
        }],
    }


class RatchetTest(unittest.TestCase):
    def run_ratchet(self, baseline, current=None):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "baseline.json").write_text(json.dumps(baseline))
            command = ["python3", str(SCRIPT), "--baseline", str(root / "baseline.json")]
            if current is not None:
                (root / "current.json").write_text(json.dumps(current))
                command += ["--current", str(root / "current.json")]
            return subprocess.run(command, capture_output=True, text=True, check=False)

    def test_valid_baseline_and_increase(self):
        self.assertEqual(0, self.run_ratchet(contract()).returncode)
        self.assertEqual(0, self.run_ratchet(contract(), contract(51.0)).returncode)

    def test_drop_is_blocked_beyond_tolerance(self):
        self.assertEqual(1, self.run_ratchet(contract(), contract(49.0)).returncode)

    def test_minimum_tolerance_is_applied(self):
        current = contract()
        current["components"][0]["metrics"]["lines"] = {"covered": 4999, "total": 10000, "percent": 49.99}
        self.assertEqual(0, self.run_ratchet(contract(), current).returncode)

    def test_partial_cannot_be_presented_as_complete(self):
        self.assertEqual(2, self.run_ratchet(contract(completeness="PARTIAL")).returncode)

    def test_expired_exception_is_blocked(self):
        baseline = contract()
        baseline["exceptions"] = [{"owner": "qa", "reason": "fixture", "scope": "sample/lines", "expires": "2000-01-01"}]
        self.assertEqual(1, self.run_ratchet(baseline, contract()).returncode)

    def test_missing_and_empty_report_are_blocked(self):
        with tempfile.TemporaryDirectory() as directory:
            missing = subprocess.run(["python3", str(SCRIPT), "--baseline", str(Path(directory) / "missing")], check=False)
            empty = Path(directory) / "empty"
            empty.touch()
            empty_result = subprocess.run(["python3", str(SCRIPT), "--baseline", str(empty)], check=False)
        self.assertEqual(2, missing.returncode)
        self.assertEqual(2, empty_result.returncode)


if __name__ == "__main__":
    unittest.main()
