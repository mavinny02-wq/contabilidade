#!/usr/bin/env python3
"""Run a bounded Codex worker with optional, isolated DeepSeek routing.

``DEEPSEEK_API_KEY`` is the opt-in boundary. Without it, the caller's Codex
command and environment are preserved without provider or model overrides.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Callable, Mapping, Sequence


DEEPSEEK_MODELS = {
    "flash": ("deepseek-v4-flash", "medium"),
    "pro": ("deepseek-v4-pro", "high"),
}

ACTIVITY_TIERS = {
    "test": "flash",
    "triage": "flash",
    "mechanical": "flash",
    "implementation": "flash",
    "architecture": "pro",
}

PRO_REASONS = (
    "cross-stack",
    "migration",
    "concurrency",
    "security",
    "architecture",
)


@dataclass(frozen=True)
class Route:
    provider: str
    tier: str
    model: str | None
    reasoning_effort: str | None
    reason: str


def read_windows_user_key() -> str | None:
    """Read the current-user key when this process predates an env change."""
    if os.name != "nt":
        return None
    try:
        import winreg

        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
            value, _ = winreg.QueryValueEx(key, "DEEPSEEK_API_KEY")
    except (FileNotFoundError, OSError):
        return None
    return value if isinstance(value, str) and value.strip() else None


def resolve_deepseek_key(
    environment: Mapping[str, str],
    windows_user_key_reader: Callable[[], str | None] | None = None,
) -> str | None:
    process_value = environment.get("DEEPSEEK_API_KEY", "")
    if process_value.strip():
        return process_value
    reader = windows_user_key_reader or read_windows_user_key
    user_value = reader()
    return user_value if user_value and user_value.strip() else None


def choose_route(tier: str, api_key: str | None) -> Route:
    if not api_key:
        return Route(
            provider="current-codex",
            tier=tier,
            model=None,
            reasoning_effort=None,
            reason="DEEPSEEK_API_KEY_NOT_AVAILABLE",
        )
    model, effort = DEEPSEEK_MODELS[tier]
    return Route(
        provider="deepseek",
        tier=tier,
        model=model,
        reasoning_effort=effort,
        reason="DEEPSEEK_API_KEY_AVAILABLE",
    )


def choose_tier(explicit_tier: str | None, activity: str) -> str:
    return explicit_tier or ACTIVITY_TIERS[activity]


def validate_pro_authorization(
    tier: str,
    api_key: str | None,
    pro_reason: str | None,
    environment: Mapping[str, str],
) -> None:
    if tier != "pro":
        if pro_reason:
            raise ValueError("--pro-reason is valid only when DeepSeek Pro is selected")
        return
    if not api_key:
        return
    if not pro_reason:
        raise ValueError(
            "DeepSeek Pro requires --pro-reason with an approved bounded reason"
        )
    if environment.get("PRIMA_DEEPSEEK_PRO_APPROVED", "").strip() != "1":
        raise ValueError(
            "DeepSeek Pro requires temporary PRIMA_DEEPSEEK_PRO_APPROVED=1 authority"
        )


def resolve_codex_executable(
    codex: str,
    platform_name: str | None = None,
    which: Callable[[str], str | None] | None = None,
) -> str:
    active_platform = platform_name or os.name
    resolver = which or shutil.which
    if active_platform == "nt" and not os.path.splitext(codex)[1]:
        windows_command = resolver(f"{codex}.cmd")
        if windows_command:
            return windows_command
    return resolver(codex) or codex


def resolve_deepseek_codex_home(
    environment: Mapping[str, str], home_directory: Path | None = None
) -> Path:
    configured = environment.get("CONTABILIDADE_DEEPSEEK_CODEX_HOME", "").strip()
    if configured:
        return Path(configured).expanduser()
    home = home_directory or Path.home()
    dedicated = home / ".codex-deepseek"
    if dedicated.is_dir():
        return dedicated
    return home / ".cache" / "contabilidade" / "codex-deepseek"


def prepare_deepseek_environment(
    environment: Mapping[str, str], api_key: str, codex_home: Path
) -> dict[str, str]:
    prepared = dict(environment)
    prepared.pop("PRIMA_DEEPSEEK_PRO_APPROVED", None)
    prepared["DEEPSEEK_API_KEY"] = api_key
    prepared["CODEX_HOME"] = str(codex_home)
    return prepared


def reject_conflicting_arguments(arguments: Sequence[str]) -> None:
    forbidden = ("--model", "-m", "--profile", "-p")
    config_prefixes = (
        "model=",
        "model_provider=",
        "model_providers.",
        "model_reasoning_effort=",
    )
    for index, argument in enumerate(arguments):
        config_value = (
            arguments[index + 1]
            if argument in ("--config", "-c") and index + 1 < len(arguments)
            else ""
        )
        inline_config = ""
        if argument.startswith(("--config=", "-c=")):
            inline_config = argument.split("=", 1)[1]
        if (
            argument in forbidden
            or argument.startswith(("--model=", "--profile=", "-m=", "-p="))
            or config_value.startswith(config_prefixes)
            or inline_config.startswith(config_prefixes)
        ):
            raise ValueError(
                "Model/provider overrides are owned by contabilidade_llm_worker.py; "
                f"remove conflicting argument {argument!r}."
            )


def build_command(codex: str, route: Route, arguments: Sequence[str]) -> list[str]:
    command = [codex]
    if route.provider == "deepseek":
        reject_conflicting_arguments(arguments)
        command.extend(
            [
                "--config",
                'model_provider="deepseek"',
                "--config",
                'model_providers.deepseek.name="DeepSeek"',
                "--config",
                'model_providers.deepseek.base_url="https://api.deepseek.com/"',
                "--config",
                'model_providers.deepseek.env_key="DEEPSEEK_API_KEY"',
                "--config",
                'model_providers.deepseek.wire_api="responses"',
                "--config",
                "model_providers.deepseek.request_max_retries=4",
                "--config",
                "model_providers.deepseek.stream_max_retries=5",
                "--config",
                "model_providers.deepseek.stream_idle_timeout_ms=300000",
                "--config",
                'shell_environment_policy.filters.DEEPSEEK_API_KEY="exclude"',
                "--config",
                f'model_reasoning_effort="{route.reasoning_effort}"',
                "--model",
                str(route.model),
            ]
        )
    command.extend(arguments)
    return command


def route_summary(route: Route) -> str:
    return "CONTABILIDADE_LLM_ROUTE " + json.dumps(asdict(route), sort_keys=True)


def execute(
    command: Sequence[str],
    environment: Mapping[str, str],
    runner: Callable[..., subprocess.CompletedProcess[str]] = subprocess.run,
) -> int:
    completed = runner(list(command), env=dict(environment), check=False)
    return int(completed.returncode)


def parse_args(arguments: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Run Codex with isolated DeepSeek when configured, otherwise keep "
            "the caller's current Codex routing"
        )
    )
    parser.add_argument("--tier", choices=tuple(DEEPSEEK_MODELS))
    parser.add_argument(
        "--activity", choices=tuple(ACTIVITY_TIERS), default="implementation"
    )
    parser.add_argument("--pro-reason", choices=PRO_REASONS)
    parser.add_argument("--codex", default="codex")
    parser.add_argument("--route-only", action="store_true")
    parser.add_argument("codex_arguments", nargs=argparse.REMAINDER)
    parsed = parser.parse_args(arguments)
    if parsed.codex_arguments[:1] == ["--"]:
        parsed.codex_arguments = parsed.codex_arguments[1:]
    if not parsed.route_only and not parsed.codex_arguments:
        parser.error("Codex arguments are required after --")
    return parsed


def main(arguments: Sequence[str] | None = None) -> int:
    args = parse_args(arguments)
    child_environment = dict(os.environ)
    api_key = resolve_deepseek_key(child_environment)
    tier = choose_tier(args.tier, args.activity)
    try:
        validate_pro_authorization(
            tier, api_key, args.pro_reason, child_environment
        )
    except ValueError as error:
        print(f"contabilidade_llm_worker: error: {error}", file=sys.stderr)
        return 2
    route = choose_route(tier, api_key)
    if api_key:
        codex_home = resolve_deepseek_codex_home(child_environment)
        if not args.route_only:
            codex_home.mkdir(parents=True, exist_ok=True)
        child_environment = prepare_deepseek_environment(
            child_environment, api_key, codex_home
        )

    print(route_summary(route), file=sys.stderr)
    if args.route_only:
        return 0

    codex_executable = resolve_codex_executable(args.codex)
    command = build_command(codex_executable, route, args.codex_arguments)
    return execute(command, child_environment)


if __name__ == "__main__":
    raise SystemExit(main())
