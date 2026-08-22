from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LAUNCHER = ROOT / "docs/orquestracao/waves/released/CONTABILIDADE_DOCKER_COMPOSE_RUNTIME_BOOTSTRAP_WAVE_015_LAUNCHERS.txt"
SHARD = ROOT / "docs/testing/plans/VAL_P0_CONTABILIDADE_DOCKER_COMPOSE_RUNTIME_002.md"
WORKFLOW = ROOT / ".github/workflows/startup-reliability.yml"
DEV_COMPOSE = ROOT / "compose.dev.yaml"


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

    def test_linux_runtime_is_executable_on_a_docker_enabled_hosted_runner(self) -> None:
        workflow = WORKFLOW.read_text(encoding="utf-8")
        dev_compose = DEV_COMPOSE.read_text(encoding="utf-8")

        self.assertIn("Linux Docker Compose runtime twice", workflow)
        self.assertIn("runs-on: ubuntu-latest", workflow)
        self.assertIn('up -d --build --wait --wait-timeout 900', workflow)
        self.assertIn('up -d --wait --wait-timeout 900', workflow)
        self.assertEqual(
            2,
            workflow.count("services=(postgres backend automation-worker frontend)"),
        )
        self.assertEqual(2, workflow.count('"${services[@]}"'))
        self.assertEqual(
            2,
            workflow.count("for forbidden_service in keycloak postgres-bootstrap"),
        )
        self.assertNotIn(
            'bootstrap_id="$("${compose[@]}" ps -aq postgres-bootstrap)"',
            workflow,
        )
        self.assertRegex(
            dev_compose,
            re.compile(
                r"^  backend:.*?^    depends_on: !override\n"
                r"      postgres:\n        condition: service_healthy$",
                re.MULTILINE | re.DOTALL,
            ),
        )
        self.assertRegex(
            dev_compose,
            re.compile(
                r"^  frontend:.*?^    depends_on: !override\n"
                r"      backend:\n        condition: service_healthy$",
                re.MULTILINE | re.DOTALL,
            ),
        )
        self.assertIn("PG_CONTAINER_FIRST", workflow)
        self.assertIn("PG_VOLUME_FIRST", workflow)
        self.assertIn("/actuator/health/readiness", workflow)
        self.assertIn("flyway_schema_history", workflow)
        self.assertIn(
            "github.event_name != 'workflow_dispatch' || !inputs.run_linux_runtime",
            workflow,
        )
        self.assertNotIn("docker compose down", workflow)
        self.assertNotIn("docker system prune", workflow)


if __name__ == "__main__":
    unittest.main()
