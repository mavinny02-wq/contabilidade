#!/bin/sh
set -eu

DB_NAME="${KEYCLOAK_DB:-keycloak}"

echo "Ensuring PostgreSQL database exists: $DB_NAME"

DATABASE_EXISTS="$(
  psql -v ON_ERROR_STOP=1 \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" \
    --set=keycloak_db="$DB_NAME" \
    --tuples-only \
    --no-align <<'EOSQL'
SELECT 1
FROM pg_database
WHERE datname = :'keycloak_db';
EOSQL
)"

if [ "$DATABASE_EXISTS" != "1" ]; then
  createdb \
    --username "$POSTGRES_USER" \
    --maintenance-db "$POSTGRES_DB" \
    "$DB_NAME"
fi
