from __future__ import annotations

import contextlib
import importlib.util
import io
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).parents[1] / "contabilidade_llm_worker.py"
spec = importlib.util.spec_from_file_location("contabilidade_llm_worker", MODULE_PATH)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
assert spec.loader
spec.loader.exec_module(module)


class ContabilidadeLlmWorkerTest(unittest.TestCase):
    def test_missing_key_preserves_current_codex_command(self) -> None:
        route = module.choose_route("flash", None)
        arguments = [
            "--model",
            "callers-model",
            "exec",
            "--config",
            'model_provider="callers-provider"',
            "bounded task",
        ]
        command = module.build_command("codex", route, arguments)

        self.assertEqual(route.provider, "current-codex")
        self.assertEqual(command, ["codex", *arguments])

    def test_blank_process_and_user_keys_preserve_current_codex(self) -> None:
        self.assertIsNone(
            module.resolve_deepseek_key(
                {"DEEPSEEK_API_KEY": "  "}, windows_user_key_reader=lambda: None
            )
        )

    def test_process_key_selects_requested_deepseek_tier_without_cli_secret(self) -> None:
        key = module.resolve_deepseek_key(
            {"DEEPSEEK_API_KEY": "secret"}, windows_user_key_reader=lambda: None
        )
        route = module.choose_route("flash", key)
        command = module.build_command("codex", route, ["exec", "bounded task"])

        self.assertEqual(route.provider, "deepseek")
        self.assertEqual(route.model, "deepseek-v4-flash")
        self.assertIn('model_provider="deepseek"', command)
        self.assertIn("deepseek-v4-flash", command)
        self.assertNotIn("secret", command)

    def test_windows_prefers_cmd_launcher(self) -> None:
        observed: list[str] = []

        def which(candidate: str) -> str | None:
            observed.append(candidate)
            return "C:/tools/codex.cmd" if candidate == "codex.cmd" else None

        resolved = module.resolve_codex_executable(
            "codex", platform_name="nt", which=which
        )

        self.assertEqual(resolved, "C:/tools/codex.cmd")
        self.assertEqual(observed, ["codex.cmd"])

    def test_deepseek_home_is_isolated_without_mutating_current_environment(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            current = {"CODEX_HOME": str(home / ".codex"), "KEEP": "yes"}
            selected = module.resolve_deepseek_codex_home(current, home)
            prepared = module.prepare_deepseek_environment(current, "secret", selected)

        self.assertEqual(
            selected, home / ".cache" / "contabilidade" / "codex-deepseek"
        )
        self.assertEqual(prepared["CODEX_HOME"], str(selected))
        self.assertEqual(prepared["DEEPSEEK_API_KEY"], "secret")
        self.assertEqual(current["CODEX_HOME"], str(home / ".codex"))
        self.assertNotIn("DEEPSEEK_API_KEY", current)

    def test_explicit_contabilidade_home_wins(self) -> None:
        selected = module.resolve_deepseek_codex_home(
            {"CONTABILIDADE_DEEPSEEK_CODEX_HOME": "~/isolated-worker"},
            Path("C:/ignored"),
        )
        self.assertEqual(selected, Path("~/isolated-worker").expanduser())

    def test_windows_user_key_is_supported(self) -> None:
        key = module.resolve_deepseek_key({}, windows_user_key_reader=lambda: "key")
        self.assertEqual(key, "key")

    def test_pro_route_uses_high_reasoning_and_shell_secret_filter(self) -> None:
        route = module.choose_route("pro", "secret")
        command = module.build_command("codex", route, ["exec", "bounded task"])

        self.assertEqual(route.model, "deepseek-v4-pro")
        self.assertIn('model_reasoning_effort="high"', command)
        self.assertIn(
            'shell_environment_policy.filters.DEEPSEEK_API_KEY="exclude"', command
        )

    def test_conflicting_model_provider_overrides_are_rejected(self) -> None:
        route = module.choose_route("pro", "secret")
        conflicting = (
            ["--model", "another-model", "exec", "task"],
            ["-m=another-model", "exec", "task"],
            ["--config", 'model_provider="openai"', "exec", "task"],
            ['--config=model_reasoning_effort="low"', "exec", "task"],
        )
        for arguments in conflicting:
            with self.subTest(arguments=arguments), self.assertRaisesRegex(
                ValueError, "owned by contabilidade_llm_worker"
            ):
                module.build_command("codex", route, arguments)

    def test_prompt_text_that_starts_like_config_is_not_rejected(self) -> None:
        route = module.choose_route("flash", "secret")
        command = module.build_command(
            "codex", route, ["exec", "model= é apenas texto do prompt"]
        )
        self.assertEqual(command[-2:], ["exec", "model= é apenas texto do prompt"])

    def test_executor_passes_key_only_through_environment_and_propagates_exit(self) -> None:
        observed: dict[str, object] = {}

        def runner(command, *, env, check):
            observed.update(command=command, env=env, check=check)
            return subprocess.CompletedProcess(command, 7)

        exit_code = module.execute(
            ["codex", "exec", "task"],
            {"DEEPSEEK_API_KEY": "secret"},
            runner=runner,
        )

        self.assertEqual(exit_code, 7)
        self.assertNotIn("secret", observed["command"])
        self.assertEqual(observed["env"]["DEEPSEEK_API_KEY"], "secret")
        self.assertFalse(observed["check"])

    def test_route_summary_never_contains_api_key(self) -> None:
        summary = module.route_summary(
            module.Route("deepseek", "pro", "deepseek-v4-pro", "high", "KEY_AVAILABLE")
        )
        self.assertNotIn("secret", summary)
        self.assertIn('"provider": "deepseek"', summary)

    def test_route_only_falls_back_without_key(self) -> None:
        stderr = io.StringIO()
        with patch.dict(os.environ, {}, clear=True), patch.object(
            module, "read_windows_user_key", return_value=None
        ), contextlib.redirect_stderr(stderr):
            exit_code = module.main(["--tier", "flash", "--route-only"])

        self.assertEqual(exit_code, 0)
        self.assertIn('"provider": "current-codex"', stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
