#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
timestamp="$(date +%Y%m%d-%H%M%S)"
mkdir -p dados/backups dados/documentos

docker compose exec -T postgres sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f "/backups/contabilidade-'"$timestamp"'.dump"'

docker run --rm \
  -v "$(pwd)/dados/documentos:/source:ro" \
  -v "$(pwd)/dados/backups:/backup" \
  alpine:3.21 \
  sh -c "tar -czf /backup/documentos-$timestamp.tar.gz -C /source ."

echo "Backup concluído: $timestamp"
