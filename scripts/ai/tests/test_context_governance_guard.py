from __future__ import annotations

import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).parents[1] / "context_governance_guard.py"
spec = importlib.util.spec_from_file_location("context_guard", MODULE_PATH)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
assert spec.loader
spec.loader.exec_module(module)


class ContextGovernanceGuardTest(unittest.TestCase):
    def make_repo(self) -> Path:
        root = Path(tempfile.mkdtemp(prefix="contabilidade-context-"))
        subprocess.run(["git", "init", "-q", root], check=True)
        files = {
            "AGENTS.md": "# AGENTS\n\nCONTEXTO_E_ORCAMENTO.md\nNão pré-carregue.\ncontext_governance_guard.py\n",
            "backend/AGENTS.md": "# Backend\n\nEspecialização curta.\n",
            "docs/INDICE_DOCUMENTACAO_ATIVA.md": "índice de roteamento, não um bundle de contexto\n\nPróxima onda / reconciliação\n",
            "docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md": "# State\n",
            "docs/ai/CHAT_BOOTSTRAP.md": "CONTABILIDADE_NEW_CHAT_BOOTSTRAP.txt\nCONTABILIDADE_EXISTING_CHAT_RESYNC.txt\n",
            "docs/ai/CONTABILIDADE_NEW_CHAT_BOOTSTRAP.txt": "Leia AGENTS.md e recupere o estado atual.\n",
            "docs/ai/CONTABILIDADE_EXISTING_CHAT_RESYNC.txt": "Reler checkpoint e delta afetado.\n",
        }
        for relative, content in files.items():
            path = root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
        subprocess.run(["git", "-C", root, "add", "."], check=True)
        return root

    def test_minimal_repository_passes(self):
        report = module.validate_repository(self.make_repo())
        self.assertEqual(report["errors"], 0, report["findings"])

    def test_root_agent_hard_limit_fails(self):
        root = self.make_repo()
        (root / "AGENTS.md").write_text("x" * 7001, encoding="utf-8")
        report = module.validate_repository(root)
        self.assertTrue(any(item["code"] == "HOT_CONTEXT_HARD_LIMIT" for item in report["findings"]))

    def test_stable_bootstrap_rejects_dynamic_history(self):
        root = self.make_repo()
        (root / "docs/ai/CONTABILIDADE_NEW_CHAT_BOOTSTRAP.txt").write_text(
            "Use PR #999 em 2026-08-19 no SHA deadbeefdeadbeefdeadbeefdeadbeefdeadbeef.\n",
            encoding="utf-8",
        )
        report = module.validate_repository(root)
        self.assertTrue(any(item["code"] == "BOOTSTRAP_DYNAMIC_HISTORY" for item in report["findings"]))

    def test_launcher_budget_and_field_contract(self):
        block = "\n".join(["TASK: T"] + [f"line-{index}" for index in range(25)])
        findings = module.validate_launcher("pack.txt", 1, block)
        codes = {item.code for item in findings}
        self.assertIn("LAUNCHER_BUDGET_EXCEEDED", codes)
        self.assertIn("LAUNCHER_FIELD_COUNT", codes)

    def test_duplicate_hot_paragraph_warns(self):
        paragraph = "Regra canônica longa " * 20
        findings = module.duplicate_paragraphs({"a": paragraph, "b": paragraph})
        self.assertEqual(findings[0].code, "HOT_CONTEXT_DUPLICATE")

    def test_negated_universal_read_instruction_is_not_a_violation(self):
        text = "Não pré-carregue todos os backlogs ou toda a documentação."
        self.assertFalse(module.requires_universal_read(text))

    def test_positive_universal_read_instruction_remains_a_violation(self):
        text = "Leia todos os documentos e todo o backlog antes de começar."
        self.assertTrue(module.requires_universal_read(text))


if __name__ == "__main__":
    unittest.main()
