#!/usr/bin/env python3
"""Reject executable recovery/destructive commands in the rehearsal harness."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main() -> int:
    policy = json.loads((ROOT / "recovery-policy.v1.json").read_text(encoding="utf-8"))
    candidates = [ROOT / "recovery_planner.py"]
    violations = []
    for candidate in candidates:
        content = candidate.read_text(encoding="utf-8").lower()
        for command in policy["forbiddenCommands"]:
            # Split the literal so this guard itself cannot be mistaken for an executor.
            if command.lower() in content:
                violations.append(f"{candidate.name}: forbidden executable token")
    if violations:
        print("\n".join(violations), file=sys.stderr)
        return 1
    print("RECOVERY_FORBIDDEN_COMMAND_GUARD_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
