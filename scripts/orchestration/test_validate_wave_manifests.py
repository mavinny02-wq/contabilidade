from __future__ import annotations

import copy
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("validate_wave_manifests.py")
SPEC = importlib.util.spec_from_file_location("validate_wave_manifests", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)
FIXTURES = Path(__file__).parent / "tests/fixtures/wave-manifests"


def fixture(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def codes(findings: list) -> set[str]:
    return {finding.code for finding in findings}


class WaveManifestLifecycleTest(unittest.TestCase):
    def test_v2_requires_deterministic_dispatch_key(self) -> None:
        manifest = fixture("released.valid.json")
        manifest["schemaVersion"] = "2.0"
        self.assertIn("OWNER_INVALID", codes(MODULE.validate_document(manifest, Path("released/wave.json"))))
        manifest["owners"][0]["dispatchKey"] = MODULE.dispatch_key(manifest["waveId"], manifest["owners"][0]["item"], manifest["baseline"]["commit"])
        self.assertEqual([], MODULE.validate_document(manifest, Path("released/wave.json")))

    def test_each_lifecycle_fixture_is_structurally_valid(self) -> None:
        for state in ("prepared", "released", "consumed", "superseded"):
            with self.subTest(state=state):
                findings = MODULE.validate_document(fixture(f"{state}.valid.json"), Path(state) / "wave.json")
                self.assertEqual([], findings)

    def test_prepared_rejects_launcher_and_release_requires_refresh(self) -> None:
        prepared = fixture("prepared.valid.json")
        prepared["launcherPath"] = "launcher.txt"
        self.assertIn("PREPARED_HAS_LAUNCHER", codes(MODULE.validate_document(prepared, Path("prepared/wave.json"))))
        released = fixture("released.valid.json")
        del released["previousManifest"]
        self.assertIn("RELEASE_WITHOUT_REFRESH", codes(MODULE.validate_document(released, Path("released/wave.json"))))

    def test_capacity_limit_rejects_six_owners(self) -> None:
        manifest = fixture("prepared.valid.json")
        manifest["owners"] = []
        for index in range(6):
            owner = copy.deepcopy(fixture("prepared.valid.json")["owners"][0])
            owner["item"] = f"ITEM-{index}"
            owner["owner"] = f"OWNER_{index}"
            manifest["owners"].append(owner)
        self.assertIn("OWNER_CAPACITY", codes(MODULE.validate_document(manifest, Path("prepared/wave.json"))))

    def test_migration_owner_limit_rejects_two(self) -> None:
        manifest = fixture("prepared.valid.json")
        second = copy.deepcopy(manifest["owners"][0])
        second.update(item="ITEM-2", owner="OWNER_2")
        manifest["owners"][0]["migration"] = True
        second["migration"] = True
        manifest["owners"].append(second)
        self.assertIn("MIGRATION_OWNER_LIMIT", codes(MODULE.validate_document(manifest, Path("prepared/wave.json"))))

    def test_consumed_wave_cannot_be_replayed(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for state in ("released", "consumed"):
                target = root / "docs/orquestracao/waves" / state / "wave.json"
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(json.dumps(fixture(f"{state}.valid.json")), encoding="utf-8")
            self.assertIn("TERMINAL_REPLAY", codes(MODULE.validate_repository(root)))

    def test_supersession_is_explicit_and_blocks_replay(self) -> None:
        manifest = fixture("superseded.valid.json")
        del manifest["supersedes"]
        self.assertIn("SUPERSESSION_MISSING", codes(MODULE.validate_document(manifest, Path("superseded/wave.json"))))
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for state in ("released", "superseded"):
                target = root / "docs/orquestracao/waves" / state / "wave.json"
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(json.dumps(fixture(f"{state}.valid.json")), encoding="utf-8")
            self.assertIn("TERMINAL_REPLAY", codes(MODULE.validate_repository(root)))


if __name__ == "__main__":
    unittest.main()
