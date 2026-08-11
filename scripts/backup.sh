#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_directory="$(pwd)/dados/backups"
document_directory="$(pwd)/dados/documentos"
version="$(tr -d '\r\n' < VERSION)"

case "$version" in
  ''|*[!A-Za-z0-9._-]*)
    echo "VERSION contém um valor inválido para o manifesto de backup." >&2
    exit 1
    ;;
esac

mkdir -p "$backup_directory" "$document_directory"

database_file="contabilidade-$timestamp.dump"
documents_file="documentos-$timestamp.tar.gz"
manifest_file="manifest-$timestamp.json"
database_path="$backup_directory/$database_file"
documents_path="$backup_directory/$documents_file"
manifest_path="$backup_directory/$manifest_file"
manifest_tmp="$manifest_path.tmp"
completed=0

cleanup() {
  if [ "$completed" -ne 1 ]; then
    rm -f "$database_path" "$documents_path" "$manifest_path" "$manifest_tmp"
  fi
}
trap cleanup EXIT HUP INT TERM

for path in "$database_path" "$documents_path" "$manifest_path"; do
  if [ -e "$path" ]; then
    echo "O arquivo de backup já existe: $path" >&2
    exit 1
  fi
done

docker compose exec -T postgres sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f "/backups/'"$database_file"'"'

docker run --rm \
  -v "$document_directory:/source:ro" \
  -v "$backup_directory:/backup" \
  alpine:3.21 \
  sh -c "tar -czf /backup/$documents_file -C /source ."

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
    return
  fi
  echo "Nenhum utilitário SHA-256 foi encontrado." >&2
  exit 1
}

database_size="$(wc -c < "$database_path" | tr -d ' ')"
documents_size="$(wc -c < "$documents_path" | tr -d ' ')"
database_hash="$(sha256_file "$database_path")"
documents_hash="$(sha256_file "$documents_path")"
created_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

cat > "$manifest_tmp" <<EOF
{
  "schemaVersion":"1.0",
  "backupId":"$timestamp",
  "createdAt":"$created_at",
  "applicationVersion":"$version",
  "components":[
    {"name":"postgresql","file":"$database_file","format":"pg_dump_custom","sizeBytes":$database_size,"sha256":"$database_hash"},
    {"name":"documents","file":"$documents_file","format":"tar_gzip","sizeBytes":$documents_size,"sha256":"$documents_hash"}
  ]
}
EOF

mv "$manifest_tmp" "$manifest_path"
sh "$(dirname "$0")/verify-backup.sh" "$manifest_path"

completed=1
trap - EXIT HUP INT TERM

echo "Backup concluído e verificado."
echo "Identificador: $timestamp"
echo "Manifesto: $manifest_path"
