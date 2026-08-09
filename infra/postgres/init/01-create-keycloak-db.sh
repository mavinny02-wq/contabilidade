#!/bin/sh
set -eu

DB_NAME="${KEYCLOAK_DB:-keycloak}"

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=keycloak_db="$DB_NAME" <<'EOSQL'
SELECT format('CREATE DATABASE %I', :'keycloak_db')
WHERE NOT EXISTS (
  SELECT 1 FROM pg_database WHERE datname = :'keycloak_db'
)\n\gexec
EOSQL
