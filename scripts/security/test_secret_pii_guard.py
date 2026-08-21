#!/usr/bin/env python3
import datetime as dt
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCANNER = Path(__file__).with_name("secret_pii_guard.py")


class GuardTest(unittest.TestCase):
    def run_guard(self, content, exceptions=None):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(["git", "init", "-q", str(root)], check=True)
            (root / "fixture.txt").write_text(content, encoding="utf-8")
            subprocess.run(["git", "-C", str(root), "add", "fixture.txt"], check=True)
            policy = root / "policy.json"
            policy.write_text(json.dumps({"exclude_paths": [], "exceptions": exceptions or []}), encoding="utf-8")
            return subprocess.run([sys.executable, str(SCANNER), "--root", str(root), "--policy", str(policy), "--json"], text=True, capture_output=True)

    def test_positive_and_redaction(self):
        samples = [
            "-----BEGIN PRIVATE KEY-----",
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature123456",
            "Authorization: Bearer synthetic-token-value-12345",
            "cpf=529.982.247-25",
        ]
        result = self.run_guard("\n".join(samples))
        self.assertEqual(1, result.returncode)
        report = json.loads(result.stdout)
        self.assertTrue({"private-key", "jwt", "bearer-token", "cpf"}.issubset({x["rule"] for x in report["findings"]}))
        for sample in samples:
            self.assertNotIn(sample, result.stdout + result.stderr)

    def test_placeholders_and_false_positives(self):
        result = self.run_guard("password=${DB_PASSWORD}\napi_key=<REDACTED>\ncnpj=12.345.678/0001-90")
        self.assertEqual(0, result.returncode, result.stdout)

    def test_runtime_assembled_synthetic_cpf_does_not_require_an_exception(self):
        source = "const cpf = `${['123', '456', '789'].join('.')}-${'00'}`;"
        result = self.run_guard(source)
        self.assertEqual(0, result.returncode, result.stdout)

    def test_literal_cpf_remains_fail_closed(self):
        result = self.run_guard("untrusted=529.982.247-25")
        self.assertEqual(1, result.returncode)
        report = json.loads(result.stdout)
        self.assertEqual(["cpf"], [item["rule"] for item in report["findings"]])
        self.assertNotIn("529.982.247-25", result.stdout + result.stderr)

    def test_expired_exception_fails(self):
        value = "529.982.247-25"
        import hashlib
        fp = hashlib.sha256(("cpf\0" + value).encode()).hexdigest()[:16]
        exception = {"path": "fixture.txt", "rule": "cpf", "fingerprint": fp, "owner": "security", "reason": "synthetic", "expires": (dt.date.today() - dt.timedelta(days=1)).isoformat()}
        result = self.run_guard(value, [exception])
        self.assertEqual(1, result.returncode)
        self.assertEqual("cpf", json.loads(result.stdout)["expired_exceptions"][0]["rule"])


if __name__ == "__main__":
    unittest.main()
