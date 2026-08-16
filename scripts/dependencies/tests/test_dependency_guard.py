import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
GUARD = ROOT / "scripts/dependencies/dependency_guard.py"
POLICY = ROOT / "scripts/dependencies/policy.json"


def component(license_id="MIT", name="pkg", version="1.0.0"):
    return {"type": "library", "name": name, "version": version,
            "purl": f"pkg:npm/{name}@{version}", "licenses": [{"license": {"id": license_id}}]}


class DependencyGuardTest(unittest.TestCase):
    def run_guard(self, bom_component, exceptions=None, findings=None):
        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            sbom = directory / "bom.json"
            sbom.write_text(json.dumps({"bomFormat": "CycloneDX", "specVersion": "1.6",
                                        "components": [bom_component]}), encoding="utf-8")
            exception_file = directory / "exceptions.json"
            exception_file.write_text(json.dumps({"schemaVersion": 1,
                                                   "exceptions": exceptions or []}), encoding="utf-8")
            command = [sys.executable, str(GUARD), "validate", "--policy", str(POLICY),
                       "--exceptions", str(exception_file), "--today", "2026-08-16"]
            if findings is not None:
                advisory = directory / "advisories.json"
                advisory.write_text(json.dumps({"schemaVersion": 1, "findings": findings}), encoding="utf-8")
                command.extend(["--advisories", str(advisory)])
            command.append(str(sbom))
            return subprocess.run(command, text=True, capture_output=True, check=False)

    @staticmethod
    def exception(expires="2026-12-31", severity="DENIED"):
        return {"component": "pkg:npm/pkg@1.0.0", "version": "1.0.0",
                "reason": "temporary fixture exception", "owner": "dependency-governance",
                "severity": severity, "expires": expires}

    def test_allowed_license_passes(self):
        self.assertEqual(0, self.run_guard(component()).returncode)

    def test_denied_license_fails(self):
        self.assertIn("DENIED license GPL-3.0", self.run_guard(component("GPL-3.0")).stderr)

    def test_denied_license_variant_fails(self):
        self.assertIn("DENIED license GPL-3.0-only", self.run_guard(component("GPL-3.0-only")).stderr)

    def test_unknown_license_fails(self):
        self.assertIn("REVIEW license UNKNOWN", self.run_guard(component("UNKNOWN")).stderr)

    def test_valid_exception_passes(self):
        self.assertEqual(0, self.run_guard(component("GPL-3.0"), [self.exception()]).returncode)

    def test_expired_exception_fails(self):
        result = self.run_guard(component("GPL-3.0"), [self.exception("2026-01-01")])
        self.assertIn("expired exception", result.stderr)

    def test_high_advisory_requires_matching_exception(self):
        finding = {"component": "pkg:npm/pkg@1.0.0", "version": "1.0.0", "severity": "HIGH"}
        self.assertIn("HIGH advisory", self.run_guard(component(), findings=[finding]).stderr)
        self.assertEqual(0, self.run_guard(component(), [self.exception(severity="HIGH")], [finding]).returncode)


if __name__ == "__main__":
    unittest.main()
