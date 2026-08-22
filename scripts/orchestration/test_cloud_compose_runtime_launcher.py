from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LAUNCHER = ROOT / "docs/orquestracao/waves/released/CONTABILIDADE_DOCKER_COMPOSE_RUNTIME_BOOTSTRAP_WAVE_015_LAUNCHERS.txt"
SHARD = ROOT / "docs/testing/plans/VAL_P0_CONTABILIDADE_DOCKER_COMPOSE_RUNTIME_002.md"


class CloudComposeRuntimeLauncherTest(unittest.TestCase):
    def test_cloud_runtime_uses_posix_compose_without_windows_prerequisites(self) -> None:
        launcher = LAUNCHER.read_text(encoding="utf-8")
        shard = SHARD.read_text(encoding="utf-8")
        combined = f"{launcher}\n{shard}"

        self.assertIn("Linux/POSIX", launcher)
        self.assertIn("no PowerShell/BAT prerequisite", launcher)
        self.assertIn('docker compose --env-file "$ENV_FILE"', shard)
        self.assertIn("up -d --build --wait --wait-timeout 900", shard)
        self.assertIn("up -d --wait --wait-timeout 900", shard)
        self.assertIn("não são pré-requisitos desta prova Linux", shard)
        self.assertNotIn("PowerShell disponível", combined)
        self.assertNotIn("start-compose-sequential.ps1", combined)
        self.assertNotIn("START_CONTABILIDADE.bat dev", combined)


if __name__ == "__main__":
    unittest.main()
