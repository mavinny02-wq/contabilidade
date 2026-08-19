from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).parents[1] / "context_token_profiler.py"
spec = importlib.util.spec_from_file_location("context_profiler", MODULE_PATH)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
assert spec.loader
spec.loader.exec_module(module)


class ContextTokenProfilerTest(unittest.TestCase):
    def test_local_estimate_is_not_actual_provider_usage(self):
        manifest = {"blocks": [{"category": "agent_rules", "source": "a", "text": "abcd" * 10}]}
        report = module.profile_manifest(manifest, Path.cwd(), None, None)
        self.assertFalse(report["measurement"]["provider_usage_is_actual"])
        self.assertIsNone(report["measurement"]["provider_usage"])
        self.assertGreater(report["profiled_input_tokens"], 0)

    def test_provider_reported_usage_is_kept_separate(self):
        manifest = {
            "blocks": [{"category": "user_prompt", "source": "p", "text": "teste"}],
            "provider_usage": {"input_tokens": 123, "output_tokens": 45, "total_tokens": 168},
        }
        report = module.profile_manifest(manifest, Path.cwd(), None, None)
        self.assertTrue(report["measurement"]["provider_usage_is_actual"])
        self.assertEqual(report["measurement"]["provider_usage"]["input_tokens"], 123)
        self.assertNotEqual(report["profiled_input_tokens"], 123)

    def test_duplicate_blocks_and_budget_warning(self):
        manifest = {
            "context_limit": 20,
            "budget": {"retrieved_code": 0.1},
            "blocks": [
                {"category": "retrieved_code", "source": "a", "text": "x" * 100},
                {"category": "retrieved_code", "source": "b", "text": "x" * 100},
            ],
        }
        report = module.profile_manifest(manifest, Path.cwd(), None, None)
        self.assertEqual(len(report["duplicate_full_blocks"]), 1)
        self.assertEqual(report["budget_warnings"][0]["category"], "retrieved_code")


if __name__ == "__main__":
    unittest.main()
