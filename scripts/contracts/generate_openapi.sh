#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${OPENAPI_PORT:-18080}"
RAW="$(mktemp)"
LOG="$(mktemp)"
PID=""
cleanup() {
  if [[ -n "$PID" ]]; then
    pkill -TERM -P "$PID" 2>/dev/null || true
    sleep 1
    pkill -KILL -P "$PID" 2>/dev/null || true
    kill "$PID" 2>/dev/null || true
  fi
  rm -f "$RAW" "$LOG"
}
trap cleanup EXIT

cd "$ROOT/backend"
mvn -q -DskipTests -Dspring-boot.run.fork=false spring-boot:run \
  -Dspring-boot.run.arguments="--server.port=$PORT --spring.flyway.enabled=false --spring.jpa.hibernate.ddl-auto=none --spring.data.jpa.repositories.bootstrap-mode=lazy --spring.datasource.hikari.initialization-fail-timeout=0 --spring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false --spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect" \
  >"$LOG" 2>&1 &
PID=$!
cd "$ROOT"

for _ in $(seq 1 90); do
  if curl --fail --silent "http://127.0.0.1:$PORT/v3/api-docs" >"$RAW" 2>/dev/null; then
    python3 "$ROOT/scripts/contracts/openapi_guard.py" generate \
      --source "$RAW" --output "$ROOT/contracts/openapi/openapi.json"
    exit 0
  fi
  kill -0 "$PID" 2>/dev/null || { cat "$LOG" >&2; exit 1; }
  sleep 1
done
echo "OpenAPI backend did not become ready" >&2
cat "$LOG" >&2
exit 1
