#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
frontend_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
entrypoint="$frontend_dir/docker-entrypoint.d/40-runtime-config.sh"
nginx_config="$frontend_dir/nginx.conf"
test_root=$(mktemp -d)
trap 'rm -rf "$test_root"' EXIT HUP INT TERM

run_mode() {
  mode=$1
  output_dir="$test_root/$mode"
  mkdir -p "$output_dir"
  APP_AUTH_ENABLED="$mode" \
  CONTABILIDADE_RUNTIME_CONFIG_FILE="$output_dir/config.js" \
  CONTABILIDADE_NGINX_AUTH_LOCATION_FILE="$output_dir/auth-location.conf" \
  CONTABILIDADE_NGINX_VALIDATE=false \
  sh "$entrypoint"
}

run_mode false
grep -F 'authEnabled: false' "$test_root/false/config.js" >/dev/null
if grep -Fiq 'keycloak' "$test_root/false/auth-location.conf"; then
  echo 'Auth-disabled mode still references Keycloak.' >&2
  exit 1
fi

run_mode true
grep -F 'authEnabled: true' "$test_root/true/config.js" >/dev/null
grep -F 'location /auth/' "$test_root/true/auth-location.conf" >/dev/null
grep -F 'proxy_pass http://keycloak:8080/auth/;' "$test_root/true/auth-location.conf" >/dev/null

if APP_AUTH_ENABLED=invalid \
  CONTABILIDADE_RUNTIME_CONFIG_FILE="$test_root/invalid/config.js" \
  CONTABILIDADE_NGINX_AUTH_LOCATION_FILE="$test_root/invalid/auth-location.conf" \
  CONTABILIDADE_NGINX_VALIDATE=false \
  sh "$entrypoint" >/dev/null 2>&1; then
  echo 'Invalid APP_AUTH_ENABLED was accepted.' >&2
  exit 1
fi

grep -F 'include /etc/nginx/contabilidade/auth-location.conf;' "$nginx_config" >/dev/null
if grep -Fiq 'proxy_pass http://keycloak' "$nginx_config"; then
  echo 'Base Nginx config still has an unconditional Keycloak upstream.' >&2
  exit 1
fi

echo '[OK] Frontend runtime auth modes rendered correctly.'
