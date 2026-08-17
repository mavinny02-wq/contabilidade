import copy
import datetime as dt
import importlib.util
import json
import subprocess
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("promotion_guard", HERE / "promotion_guard.py")
guard = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(guard)
NOW = dt.datetime(2026, 8, 17, tzinfo=dt.timezone.utc)
COMMIT = "1" * 40
DIGESTS = json.loads((HERE / "fixtures/expected-digests.json").read_text())


class PromotionGuardTest(unittest.TestCase):
    def fixture(self, name):
        return json.loads((HERE / "fixtures" / f"{name}.json").read_text())

    def validate(self, bundle, target=12):
        return guard.validate(bundle, expected_version="0.5.1", expected_commit=COMMIT,
                              target_frontier=target, now=NOW, expected_digests=DIGESTS)

    def test_valid_promotion_and_safe_rollback(self):
        self.assertEqual([], self.validate(self.fixture("valid-promotion")))
        self.assertEqual([], self.validate(self.fixture("safe-rollback")))

    def test_digest_and_authority_failures(self):
        for fixture in ("mutable-tag", "invalid-digest", "version-sha-divergence"):
            with self.subTest(fixture=fixture):
                self.assertTrue(self.validate(self.fixture(fixture)))

    def test_flyway_downgrade_and_unsafe_rollback_fail(self):
        self.assertIn("promotion would downgrade the target Flyway frontier",
                      self.validate(self.fixture("schema-downgrade")))
        self.assertIn("rollback target is below the applied Flyway frontier",
                      self.validate(self.fixture("unsafe-rollback")))

    def test_expired_exception_fails(self):
        self.assertIn("exception has expired", self.validate(self.fixture("expired-exception")))

    def test_duplicate_missing_artifact_and_digest_divergence_fail(self):
        bundle = self.fixture("valid-promotion")
        bundle["components"].append(copy.deepcopy(bundle["components"][0]))
        self.assertTrue(any("duplicate components" in error for error in self.validate(bundle)))
        bundle = self.fixture("valid-promotion")
        del bundle["components"][0]["sbomSha256"]
        self.assertTrue(any("sbomSha256" in error for error in self.validate(bundle)))
        bundle = self.fixture("valid-promotion")
        bundle["components"][0]["imageDigest"] = bundle["components"][1]["imageDigest"][:-1] + "b"
        self.assertTrue(any("diverges" in error for error in self.validate(bundle)))

    def test_json_and_markdown_are_deterministic_and_do_not_expose_registry(self):
        fixture = HERE / "fixtures/valid-promotion.json"
        json_one = guard.report(fixture, [], "json")
        self.assertEqual(json_one, guard.report(fixture, [], "json"))
        self.assertEqual(guard.report(fixture, [], "markdown"), guard.report(fixture, [], "markdown"))
        self.assertNotIn("ghcr.io", json_one)

    def test_cli_exit_codes(self):
        command = ["python", str(HERE / "promotion_guard.py"),
                   str(HERE / "fixtures/valid-promotion.json"), "--target-frontier", "12",
                   "--expected-digests", str(HERE / "fixtures/expected-digests.json"),
                   "--expected-version", "0.5.1", "--expected-commit", COMMIT,
                   "--now", "2026-08-17T00:00:00Z"]
        first = subprocess.run(command, text=True, capture_output=True, check=False)
        second = subprocess.run(command, text=True, capture_output=True, check=False)
        self.assertEqual(0, first.returncode)
        self.assertEqual(first.stdout, second.stdout)


if __name__ == "__main__":
    unittest.main()
