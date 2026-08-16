#!/usr/bin/env bash
set -euo pipefail

readonly ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
readonly OUTPUT="${1:-$ROOT/dependency-artifacts}"
readonly GUARD="$ROOT/scripts/dependencies/dependency_guard.py"
mkdir -p "$OUTPUT/raw"

mvn -f "$ROOT/backend/pom.xml" org.cyclonedx:cyclonedx-maven-plugin:2.9.1:makeAggregateBom \
  -DoutputFormat=json -DoutputName=bom -DoutputDirectory="$OUTPUT/raw/backend"
npx --yes @cyclonedx/cyclonedx-npm@4.0.3 --package-lock-only \
  --output-format JSON --output-file "$OUTPUT/raw/frontend.json" "$ROOT/frontend/package.json"
npx --yes @cyclonedx/cyclonedx-npm@4.0.3 --package-lock-only \
  --output-format JSON --output-file "$OUTPUT/raw/automation-worker.json" "$ROOT/automation-worker/package.json"

python "$GUARD" normalize "$OUTPUT/raw/backend/bom.json" "$OUTPUT/backend.cdx.json"
python "$GUARD" normalize "$OUTPUT/raw/frontend.json" "$OUTPUT/frontend.cdx.json"
python "$GUARD" normalize "$OUTPUT/raw/automation-worker.json" "$OUTPUT/automation-worker.cdx.json"
python "$GUARD" index "$OUTPUT/index.json" "$OUTPUT/backend.cdx.json" \
  "$OUTPUT/frontend.cdx.json" "$OUTPUT/automation-worker.cdx.json"
python "$GUARD" validate --policy "$ROOT/scripts/dependencies/policy.json" \
  --exceptions "$ROOT/scripts/dependencies/exceptions.json" \
  "$OUTPUT/backend.cdx.json" "$OUTPUT/frontend.cdx.json" "$OUTPUT/automation-worker.cdx.json"
