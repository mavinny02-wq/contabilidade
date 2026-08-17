import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GUARD = ROOT / "scripts/environment/environment_guard.py"
FILES = ["compose.yaml", "compose.dev.yaml", "compose.onpremise.yaml", ".env.example", "scripts/deploy-contabilidade-onpremise.ps1", ".github/workflows/environment-governance.yml"]


class EnvironmentGuardTest(unittest.TestCase):
    def run_fixture(self, replacements=()):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in FILES:
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / name, target)
            for name, old, new in replacements:
                path = root / name
                path.write_text(path.read_text(encoding="utf-8").replace(old, new), encoding="utf-8")
            return subprocess.run(["python3", str(GUARD), "--root", str(root)], text=True, capture_output=True)

    def test_repository_contract_is_valid_and_json(self):
        result = self.run_fixture()
        self.assertEqual(0, result.returncode, result.stderr)
        json.loads(result.stdout)

    def test_auth_off_outside_dev_fails(self):
        result = self.run_fixture([("compose.onpremise.yaml", "SPRING_PROFILES_ACTIVE: onpremise", "SPRING_PROFILES_ACTIVE: onpremise\n      APP_SECURITY_ENABLED: false")])
        self.assertIn("ONPREMISE_AUTH_REQUIRED", result.stderr)

    def test_dev_auth_drift_fails(self):
        result = self.run_fixture([("compose.dev.yaml", 'APP_SECURITY_ENABLED: "false"', 'APP_SECURITY_ENABLED: "true"')])
        self.assertIn("DEV_AUTH_NOT_DISABLED", result.stderr)

    def test_missing_keycloak_fails(self):
        result = self.run_fixture([("compose.yaml", "  keycloak:", "  removed-keycloak:")])
        self.assertIn("ONPREMISE_AUTH_REQUIRED", result.stderr)

    def test_provider_enabled_fails(self):
        result = self.run_fixture([("compose.yaml", "SERPRO_CND_ALLOW_STATIC_BEARER:-false", "SERPRO_CND_ALLOW_STATIC_BEARER:-true")])
        self.assertIn("PROVIDER_DEFAULT_ENABLED", result.stderr)

    def test_onpremise_build_fails(self):
        result = self.run_fixture([("scripts/deploy-contabilidade-onpremise.ps1", "param(", "docker build .\nparam(")])
        self.assertIn("ONPREMISE_BUILD_COMMAND", result.stderr)

    def test_example_secret_acceptance_fails(self):
        result = self.run_fixture([("scripts/deploy-contabilidade-onpremise.ps1", "altere-esta-senha", "removed-marker")])
        self.assertIn("EXAMPLE_SECRET_ACCEPTED", result.stderr)

    def test_unsafe_endpoint_fails(self):
        result = self.run_fixture([(".env.example", "PUBLIC_BASE_URL=http://localhost:8088", "PUBLIC_BASE_URL=*")])
        self.assertIn("UNSAFE_PUBLIC_ENDPOINT", result.stderr)

    def test_ci_network_drift_fails(self):
        result = self.run_fixture([(".github/workflows/environment-governance.yml", 'CI_EXTERNAL_NETWORK_DEFAULT: "false"', 'CI_EXTERNAL_NETWORK_DEFAULT: "true"')])
        self.assertIn("CI_ISOLATION_DRIFT", result.stderr)


if __name__ == "__main__":
    unittest.main()
