from __future__ import annotations

import json
import hashlib
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("dispatch_guard.py")
BASELINE_A = "1" * 40
BASELINE_B = "2" * 40


def dispatch_key(wave: str, item: str, baseline: str) -> str:
    material = json.dumps([wave, item, baseline], separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(material.encode()).hexdigest()


class DispatchGuardTest(unittest.TestCase):
    def run_guard(self, registry: Path, wave: str = "WAVE_001", item: str = "ITEM-001", baseline: str = BASELINE_A, *extra: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--wave", wave, "--item", item, "--baseline", baseline, "--registry", str(registry), *extra],
            text=True, capture_output=True, check=False,
        )

    def test_duplicate_same_baseline_is_rejected_and_superseded(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            registry = Path(temporary) / "registry.json"
            self.assertEqual(0, self.run_guard(registry, "WAVE_001", "ITEM-001", BASELINE_A, "--register").returncode)
            replay = self.run_guard(registry)
            self.assertEqual(1, replay.returncode)
            self.assertIn("SUPERSEDED_DUPLICATE_OWNER", replay.stdout)
            entries = json.loads(registry.read_text(encoding="utf-8"))["dispatches"]
            self.assertEqual("SUPERSEDED_DUPLICATE_OWNER", entries[dispatch_key("WAVE_001", "ITEM-001", BASELINE_A)]["status"])

    def test_new_baseline_has_a_new_key(self) -> None:
        self.assertNotEqual(dispatch_key("WAVE_001", "ITEM-001", BASELINE_A), dispatch_key("WAVE_001", "ITEM-001", BASELINE_B))

    def test_distinct_owner_items_do_not_collide(self) -> None:
        self.assertNotEqual(dispatch_key("WAVE_001", "ITEM-001", BASELINE_A), dispatch_key("WAVE_001", "ITEM-002", BASELINE_A))

    def test_terminal_registry_entry_blocks_replay(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            registry = Path(temporary) / "registry.json"
            key = dispatch_key("WAVE_001", "ITEM-001", BASELINE_A)
            registry.write_text(json.dumps({"schemaVersion": "1.0", "dispatches": {key: {"status": "INTEGRATED"}}}), encoding="utf-8")
            self.assertEqual(1, self.run_guard(registry).returncode)

    def test_missing_github_credentials_is_classified_not_an_override(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            result = self.run_guard(Path(temporary) / "registry.json", "WAVE_001", "ITEM-001", BASELINE_A, "--github-aware")
            self.assertEqual(0, result.returncode)
            self.assertIn("GITHUB_UNAVAILABLE", result.stdout)

    def test_new_result_must_expose_matching_key(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            result_path = root / "result.md"
            result_path.write_text("DISPATCH_KEY: wrong\n", encoding="utf-8")
            rejected = self.run_guard(root / "registry.json", "WAVE_001", "ITEM-001", BASELINE_A, "--result", str(result_path))
            self.assertEqual(2, rejected.returncode)
            result_path.write_text(f"DISPATCH_KEY: {dispatch_key('WAVE_001', 'ITEM-001', BASELINE_A)}\n", encoding="utf-8")
            self.assertEqual(0, self.run_guard(root / "registry.json", "WAVE_001", "ITEM-001", BASELINE_A, "--result", str(result_path)).returncode)


if __name__ == "__main__":
    unittest.main()
