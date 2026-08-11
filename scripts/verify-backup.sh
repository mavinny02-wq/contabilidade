#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."
backup_directory="$(pwd)/dados/backups"
manifest_path="${1:-}"

if [ -z "$manifest_path" ]; then
  manifest_path="$(ls -1t "$backup_directory"/manifest-*.json 2>/dev/null | sed -n '1p' || true)"
fi

if [ -z "$manifest_path" ] || [ ! -f "$manifest_path" ]; then
  echo "Manifesto de backup não encontrado: ${manifest_path:-nenhum}" >&2
  exit 1
fi

manifest_directory="$(cd "$(dirname "$manifest_path")" && pwd)"
manifest_path="$manifest_directory/$(basename "$manifest_path")"

extract_string() {
  key="$1"
  sed -n 's/.*"'"$key"'":"\([^"]*\)".*/\1/p' "$manifest_path" | sed -n '1p'
}

schema_version="$(extract_string schemaVersion)"
backup_id="$(extract_string backupId)"
created_at="$(extract_string createdAt)"
application_version="$(extract_string applicationVersion)"

[ "$schema_version" = "1.0" ] || {
  echo "Versão de schema do manifesto não suportada: $schema_version" >&2
  exit 1
}
[ -n "$backup_id" ] || { echo "backupId ausente no manifesto." >&2; exit 1; }
[ -n "$created_at" ] || { echo "createdAt ausente no manifesto." >&2; exit 1; }
[ -n "$application_version" ] || { echo "applicationVersion ausente no manifesto." >&2; exit 1; }

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

component_lines="$(sed -n '/{"name":/p' "$manifest_path")"
component_count="$(printf '%s\n' "$component_lines" | sed '/^$/d' | wc -l | tr -d ' ')"
[ "$component_count" -ge 2 ] || {
  echo "O manifesto deve conter ao menos PostgreSQL e documentos." >&2
  exit 1
}

has_postgresql=0
has_documents=0
seen_names='|'
seen_files='|'
old_ifs=$IFS
IFS='
'
for line in $component_lines; do
  name="$(printf '%s\n' "$line" | sed -n 's/.*"name":"\([^"]*\)".*/\1/p')"
  file="$(printf '%s\n' "$line" | sed -n 's/.*"file":"\([^"]*\)".*/\1/p')"
  size="$(printf '%s\n' "$line" | sed -n 's/.*"sizeBytes":\([0-9][0-9]*\).*/\1/p')"
  expected_hash="$(printf '%s\n' "$line" | sed -n 's/.*"sha256":"\([0-9A-Fa-f]*\)".*/\1/p' | tr 'A-F' 'a-f')"

  [ -n "$name" ] || { echo "Componente sem nome." >&2; exit 1; }
  [ -n "$file" ] || { echo "Componente sem arquivo." >&2; exit 1; }
  [ -n "$size" ] || { echo "Tamanho ausente para $file." >&2; exit 1; }
  case "$file" in
    */*|*\\*|*..*)
      echo "Caminho inseguro no manifesto: $file" >&2
      exit 1
      ;;
  esac
  case "$expected_hash" in
    *[!0-9a-f]*|'')
      echo "SHA-256 inválido para $file." >&2
      exit 1
      ;;
  esac
  [ "${#expected_hash}" -eq 64 ] || { echo "SHA-256 inválido para $file." >&2; exit 1; }

  case "$seen_names" in *"|$name|"*) echo "Componente duplicado: $name" >&2; exit 1;; esac
  case "$seen_files" in *"|$file|"*) echo "Arquivo duplicado: $file" >&2; exit 1;; esac
  seen_names="$seen_names$name|"
  seen_files="$seen_files$file|"

  component_path="$manifest_directory/$file"
  [ -f "$component_path" ] || { echo "Componente ausente: $component_path" >&2; exit 1; }

  actual_size="$(wc -c < "$component_path" | tr -d ' ')"
  [ "$actual_size" = "$size" ] || {
    echo "Tamanho divergente em $file. Esperado=$size Atual=$actual_size" >&2
    exit 1
  }

  actual_hash="$(sha256_file "$component_path" | tr 'A-F' 'a-f')"
  [ "$actual_hash" = "$expected_hash" ] || {
    echo "SHA-256 divergente em $file." >&2
    exit 1
  }

  [ "$name" = "postgresql" ] && has_postgresql=1
  [ "$name" = "documents" ] && has_documents=1
  echo "[OK] $name — $file — $actual_size bytes"
done
IFS=$old_ifs

[ "$has_postgresql" -eq 1 ] || { echo "Componente PostgreSQL ausente." >&2; exit 1; }
[ "$has_documents" -eq 1 ] || { echo "Componente documents ausente." >&2; exit 1; }

echo "[OK] Manifesto verificado: $manifest_path"
echo "[OK] BackupId=$backup_id Versão=$application_version CriadoEm=$created_at"
