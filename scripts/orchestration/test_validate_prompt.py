from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("validate_prompt.py")
SPEC = importlib.util.spec_from_file_location("validate_prompt", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class PromptValidatorTest(unittest.TestCase):
    def launcher(self, task: str = "STR-ORQ-001", migration: str = "NONE") -> str:
        return f"""TASK: {task}
BASELINE: latest main
PREPARE: docs
READ:
- root + nearest AGENTS.md
- docs/roadmap/estrutural/STR_ORQ_001_BRANCH_PROTECTION.md
LOCKS: LOCK-GIT-001
OWNER: governance
MIGRATION: {migration}
VALIDATE: python3 scripts/orchestration/validate_orchestration_governance.py --repo-root .
RESULT_MD: docs/implementacao/{task}_RESULT.md
"""

    def test_valid_launcher(self) -> None:
        self.assertFalse([f for f in MODULE.validate_launcher(self.launcher()) if f.severity == "ERROR"])

    def test_launcher_rejects_missing_field(self) -> None:
        findings = MODULE.validate_launcher(self.launcher().replace("OWNER: governance\n", ""))
        self.assertTrue(any(f.code == "LAUNCHER_FIELD" for f in findings))

    def test_pack_rejects_more_than_five(self) -> None:
        pack = "\n\n".join(self.launcher(f"TASK-{i}") for i in range(6))
        self.assertTrue(any(f.code == "PACK_CAPACITY" for f in MODULE.validate_pack(pack)))

    def test_pack_rejects_two_migrations(self) -> None:
        pack = self.launcher("A", "V13__a.sql") + "\n\n" + self.launcher("B", "V14__b.sql")
        self.assertTrue(any(f.code == "PACK_MIGRATION_OWNERS" for f in MODULE.validate_pack(pack)))

    def test_bootstrap_rejects_dynamic_sha(self) -> None:
        findings = MODULE.validate_bootstrap("mavinny02-wq/contabilidade main AGENTS.md CONTABILIDADE_CURRENT_STATE.md CONTEXTO_E_ORCAMENTO.md explicit trigger 0123456789abcdef0123456789abcdef01234567")
        self.assertTrue(any(f.code == "DYNAMIC_SHA" for f in findings))


if __name__ == "__main__":
    unittest.main()
