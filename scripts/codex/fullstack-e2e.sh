#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"; RUNTIME_DIR="$(mktemp -d -t contabilidade-codex-e2e.XXXXXX)"; declare -a PIDS=(); POSTGRES_INICIADO=false
logs(){ echo 'Falha no full-stack; últimas linhas dos logs locais:' >&2; for log in "$RUNTIME_DIR"/*.log; do [[ -f "$log" ]] && { echo "--- $(basename "$log") ---" >&2; tail -n 60 "$log" >&2; }; done; }
cleanup(){ local s=$?; trap - EXIT INT TERM; for ((i=${#PIDS[@]}-1;i>=0;i--)); do kill "${PIDS[$i]}" 2>/dev/null || true; wait "${PIDS[$i]}" 2>/dev/null || true; done; if [[ "$POSTGRES_INICIADO" == true ]]; then read -r v c _ < <(pg_lsclusters --no-header | head -1); pg_ctlcluster "$v" "$c" stop >/dev/null 2>&1 || true; fi; ((s==0)) || logs; rm -rf "$RUNTIME_DIR"; exit "$s"; }
trap cleanup EXIT INT TERM
wait_http(){ local url=$1 nome=$2 tentativas=${3:-90}; for ((i=1;i<=tentativas;i++)); do if curl -sf --max-time 2 "$url" >/dev/null; then echo "$nome pronto: $url"; return; fi; sleep 1; done; echo "$nome não ficou pronto: $url" >&2; return 1; }
for port in 8080 3001 5173; do if ! python3 - "$port" <<'PY'
import socket, sys
s = socket.socket(); s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
try: s.bind(('127.0.0.1', int(sys.argv[1])))
except OSError: raise SystemExit(1)
finally: s.close()
PY
  then echo "Porta $port ocupada por processo desconhecido; execução recusada." >&2; exit 1; fi; done
export APP_ENVIRONMENT=CODEX_CLOUD SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/contabilidade_codex_e2e SPRING_DATASOURCE_USERNAME=contabilidade SPRING_DATASOURCE_PASSWORD=contabilidade
export SPRING_PROFILES_ACTIVE=local APP_SECURITY_ENABLED=false APP_WORKER_TOKEN=codex-cloud-worker-token-local APP_AUTOMATION_SESSION_SIGNING_SECRET=codex-cloud-session-signing-secret-local-only-1234567890
export APP_CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173
export BACKEND_URL=http://127.0.0.1:8080 WORKER_TOKEN=codex-cloud-worker-token-local WORKER_HOST=127.0.0.1 WORKER_PORT=3001 SERPRO_CND_ALLOW_STATIC_BEARER=false
export BROWSER_CHROMIUM_SANDBOX=false
export FEDERAL_CERTIFICATE_PORTAL_URL=http://127.0.0.1:9/disabled PGE_SP_PORTAL_URL=http://127.0.0.1:9/disabled SEFAZ_SP_PORTAL_URL=http://127.0.0.1:9/disabled
[[ "$APP_ENVIRONMENT" == CODEX_CLOUD && "$SPRING_DATASOURCE_URL" == jdbc:postgresql://127.0.0.1:5432/contabilidade_codex_e2e && "$SPRING_DATASOURCE_USERNAME" == contabilidade ]] || { echo 'Checks destrutivos recusados.' >&2; exit 1; }
if ! pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then read -r PG_VERSION PG_CLUSTER _ < <(pg_lsclusters --no-header | head -1); pg_ctlcluster "$PG_VERSION" "$PG_CLUSTER" start; POSTGRES_INICIADO=true; fi
for _ in {1..30}; do pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1 && break; sleep 1; done; pg_isready -h 127.0.0.1 -p 5432 >/dev/null
runuser -u postgres -- psql -v ON_ERROR_STOP=1 --quiet <<'SQL'
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'contabilidade_codex_e2e';
DROP DATABASE IF EXISTS contabilidade_codex_e2e;
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='contabilidade') THEN CREATE ROLE contabilidade LOGIN PASSWORD 'contabilidade'; ELSE ALTER ROLE contabilidade WITH LOGIN PASSWORD 'contabilidade'; END IF; END $$;
CREATE DATABASE contabilidade_codex_e2e OWNER contabilidade;
SQL
(cd "$ROOT/backend" && exec java -jar target/contabilidade-backend.jar --server.address=127.0.0.1) >"$RUNTIME_DIR/backend.log" 2>&1 & PIDS+=("$!"); wait_http http://127.0.0.1:8080/actuator/health/readiness backend 120
(cd "$ROOT/automation-worker" && exec node dist/index.js) >"$RUNTIME_DIR/worker.log" 2>&1 & PIDS+=("$!"); wait_http http://127.0.0.1:3001/health worker 60
(cd "$ROOT/frontend" && exec npm run dev -- --host 127.0.0.1 --port 5173) >"$RUNTIME_DIR/frontend.log" 2>&1 & PIDS+=("$!"); wait_http http://127.0.0.1:5173/ frontend 60
for url in http://127.0.0.1:8080/actuator/health/liveness http://127.0.0.1:8080/actuator/health/readiness http://127.0.0.1:3001/health http://127.0.0.1:5173/ http://127.0.0.1:5173/api/info; do status="$(curl -s -o /dev/null -w '%{http_code}' "$url")"; [[ "$status" == 200 ]] || { echo "Status $status em $url" >&2; exit 1; }; echo "HTTP 200 $url"; done
sleep 6
PGPASSWORD=contabilidade psql -h 127.0.0.1 -U contabilidade -d contabilidade_codex_e2e -v ON_ERROR_STOP=1 -Atc "SELECT version||':'||success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1" | grep -qx '12:true'
PGPASSWORD=contabilidade psql -h 127.0.0.1 -U contabilidade -d contabilidade_codex_e2e -v ON_ERROR_STOP=1 -Atc "SELECT count(*)>0 FROM worker_heartbeats" | grep -qx t
node "$ROOT/scripts/codex/e2e-smoke.mjs"
! grep -Eq 'HTTP (500|5[0-9]{2})|status=500' "$RUNTIME_DIR"/*.log
echo "Full-stack E2E aprovado. PIDs: ${PIDS[*]}. Logs temporários: $RUNTIME_DIR"
