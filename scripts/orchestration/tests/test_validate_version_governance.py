import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "scripts/orchestration/validate-version-governance.py"
SPEC = importlib.util.spec_from_file_location("version_guard", SCRIPT)
guard = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(guard)


class VersionGovernanceTest(unittest.TestCase):
    FILES = (
        "VERSION", "backend/pom.xml", "frontend/package.json", "frontend/package-lock.json",
        "automation-worker/package.json", "automation-worker/package-lock.json", "compose.yaml",
        "scripts/deploy-contabilidade-onpremise.ps1", "release/release-metadata.template.json",
    )

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        for relative in self.FILES:
            target = self.root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / relative, target)

    def tearDown(self):
        self.temp.cleanup()

    def assert_drift(self, relative, old, new, code):
        path = self.root / relative
        path.write_text(path.read_text(encoding="utf-8").replace(old, new, 1), encoding="utf-8")
        with self.assertRaisesRegex(guard.VersionError, code):
            guard.validate(self.root)

    def test_current_repository_is_consistent(self):
        self.assertEqual("0.5.1", guard.validate(self.root))

    def test_version_drift_fixture(self):
        self.assert_drift("VERSION", "0.5.1", "release-1", "VERSION_FORMAT_INVALID")

    def test_maven_drift_fixture(self):
        self.assert_drift("backend/pom.xml", "0.5.1-SNAPSHOT", "0.5.0-SNAPSHOT", "VERSION_MAVEN_DRIFT")

    def test_npm_drift_fixture(self):
        self.assert_drift("frontend/package.json", '"version": "0.5.1"', '"version": "0.5.0"', "VERSION_NPM_DRIFT")

    def test_image_drift_fixture(self):
        self.assert_drift("scripts/deploy-contabilidade-onpremise.ps1", 'contabilidade-backend:$version',
                          'contabilidade-backend:latest', "VERSION_IMAGE_DRIFT")

    def test_release_metadata_drift_fixture(self):
        path = self.root / "release/release-metadata.template.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        data["images"]["contabilidade-frontend"]["digest"] = "latest"
        path.write_text(json.dumps(data), encoding="utf-8")
        with self.assertRaisesRegex(guard.VersionError, "VERSION_RELEASE_DIGEST_MISSING"):
            guard.validate(self.root)


if __name__ == "__main__":
    unittest.main()
