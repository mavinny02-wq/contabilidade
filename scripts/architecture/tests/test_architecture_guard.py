import json
import tempfile
import unittest
from datetime import date
from pathlib import Path

from scripts.architecture.architecture_guard import Finding, analyze, typescript_edges, validate_allowlist


class ArchitectureGuardTest(unittest.TestCase):
    def fixture(self, files):
        temporary = tempfile.TemporaryDirectory()
        root = Path(temporary.name)
        for name, content in files.items():
            path = root / name; path.parent.mkdir(parents=True, exist_ok=True); path.write_text(content)
        self.addCleanup(temporary.cleanup)
        return root

    def test_graph_is_stable_and_resolves_alias(self):
        root = self.fixture({"a.ts": "import x from '@/z'", "z.ts": "export default 1"})
        first = typescript_edges(root)
        self.assertEqual(first, typescript_edges(root))
        self.assertEqual(first[0][1].name, "z.ts")

    def test_synthetic_cycle_and_forbidden_edge(self):
        repo = self.fixture({
            "frontend/src/pages/A.ts": "import './B'", "frontend/src/pages/B.ts": "import './A'",
            "backend/src/main/java/br/com/contabilidade/common/C.java": "package br.com.contabilidade.common;\nimport br.com.contabilidade.foo.F;",
            "backend/src/main/java/br/com/contabilidade/foo/F.java": "package br.com.contabilidade.foo; public class F {}",
        })
        findings, _ = analyze(repo)
        rules = {finding.rule for finding in findings}
        self.assertIn("frontend.cycle", rules)
        self.assertIn("frontend.page_to_page", rules)
        self.assertIn("backend.common_to_feature", rules)

    def test_valid_and_expired_allowlist(self):
        finding = Finding("rule", "source", "target")
        entry = {**finding.record(), "reason": "legacy", "owner": "team", "review_by": "2099-01-01"}
        self.assertEqual([], validate_allowlist([finding], {"entries": [entry]}, date(2026, 1, 1)))
        entry["review_by"] = "2025-01-01"
        self.assertIn("expired", validate_allowlist([finding], {"entries": [entry]}, date(2026, 1, 1))[0])

    def test_new_finding_is_rejected(self):
        errors = validate_allowlist([Finding("r", "a", "b")], {"entries": []}, date.today())
        self.assertTrue(errors[0].startswith("NEW r"))


if __name__ == "__main__": unittest.main()
