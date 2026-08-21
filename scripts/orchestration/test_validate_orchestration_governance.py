from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("validate_orchestration_governance.py")
SPEC = importlib.util.spec_from_file_location("validate_governance", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class GovernanceGuardTest(unittest.TestCase):
    def test_repository_fixture_passes(self) -> None:
        repo_root = Path(__file__).resolve().parents[2]
        report = MODULE.validate(repo_root)
        errors = [item for item in report["findings"] if item["severity"] == "ERROR"]
        self.assertEqual([], errors)

    def test_current_marker_matching_is_case_insensitive(self) -> None:
        findings = []
        text = " ".join(marker.upper() for marker in MODULE.REQUIRED_MARKERS["AGENTS.md"])
        MODULE.validate_required_markers("AGENTS.md", text, findings)
        self.assertEqual([], findings)

    def test_legacy_chat_markers_do_not_mask_current_contract_drift(self) -> None:
        findings = []
        legacy = "Novo chat Ressincronização validate_prompt.py"
        MODULE.validate_required_markers("docs/ai/CHAT_BOOTSTRAP.md", legacy, findings)
        self.assertEqual(3, len(findings))
        self.assertTrue(all(item.code == "ROUTING_MARKER_MISSING" for item in findings))

    def test_config_rejects_two_migration_owners(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            path = root / ".contabilidade-orchestrator/config.json"
            path.parent.mkdir(parents=True)
            path.write_text(json.dumps({
                "schemaVersion": "2.0",
                "ondas": {
                    "minOwnersExecutaveis": 1,
                    "maxOwnersExecutaveis": 5,
                    "migrationOwnerLimit": 2,
                    "dependenciaMesmaOndaPermitida": False,
                },
                "git": {"pushDiretoIntegracaoPermitido": False},
                "operacoesExternas": {"providerRealDefault": "DENIED"},
            }), encoding="utf-8")
            findings = []
            MODULE.validate_config(root, findings)
            self.assertTrue(any(item.code == "MIGRATION_LIMIT" for item in findings))


if __name__ == "__main__":
    unittest.main()
