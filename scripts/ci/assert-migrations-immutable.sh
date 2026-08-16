#!/usr/bin/env bash
set -euo pipefail

base_ref="${GITHUB_BASE_REF:-main}"
git fetch --no-tags origin "$base_ref" 2>/dev/null || true
base="$(git merge-base HEAD "origin/$base_ref" 2>/dev/null || git merge-base HEAD "$base_ref" 2>/dev/null || true)"

if [[ -z "$base" ]]; then
  echo "Unable to determine the base revision used to audit existing migrations." >&2
  exit 1
fi

changed="$(git diff --name-status "$base"...HEAD -- backend/src/main/resources/db/migration/ | awk '$1 != "A" { print }')"
if [[ -n "$changed" ]]; then
  echo "Existing Flyway migrations are immutable; only newly added migration files are allowed:" >&2
  printf '%s\n' "$changed" >&2
  exit 1
fi

echo "Existing Flyway migrations are unchanged."
