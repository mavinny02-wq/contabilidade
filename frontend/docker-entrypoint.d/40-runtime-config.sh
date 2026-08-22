#!/bin/sh
set -eu

auth_enabled=${APP_AUTH_ENABLED:-false}
case "$auth_enabled" in
  true|false) ;;
  *)
    echo "APP_AUTH_ENABLED must be exactly 'true' or 'false'." >&2
    exit 1
    ;;
esac

runtime_config_file=${CONTABILIDADE_RUNTIME_CONFIG_FILE:-/usr/share/nginx/html/config.js}
auth_location_file=${CONTABILIDADE_NGINX_AUTH_LOCATION_FILE:-/etc/nginx/contabilidade/auth-location.conf}
mkdir -p "$(dirname "$runtime_config_file")" "$(dirname "$auth_location_file")"

cat > "$runtime_config_file" <<EOF_CONFIG
window.__CONTABILIDADE_CONFIG__ = {
  apiBaseUrl: '${APP_API_BASE_URL:-/api}',
  authEnabled: $auth_enabled,
  keycloakUrl: '${APP_KEYCLOAK_URL:-/auth}',
  keycloakRealm: '${APP_KEYCLOAK_REALM:-contabilidade}',
  keycloakClientId: '${APP_KEYCLOAK_CLIENT_ID:-contabilidade-frontend}'
};
EOF_CONFIG

if [ "$auth_enabled" = 'true' ]; then
  cat > "$auth_location_file" <<'EOF_AUTH'
location /auth/ {
  proxy_pass http://keycloak:8080/auth/;
  proxy_http_version 1.1;
  proxy_set_header Host $http_host;
  proxy_set_header X-Forwarded-Host $http_host;
  proxy_set_header X-Forwarded-Proto $contabilidade_forwarded_proto;
  proxy_set_header X-Forwarded-Port $contabilidade_forwarded_port;
  proxy_set_header X-Real-IP $remote_addr;
}
EOF_AUTH
else
  cat > "$auth_location_file" <<'EOF_AUTH_DISABLED'
# APP_AUTH_ENABLED=false: authentication proxy intentionally omitted in development.
EOF_AUTH_DISABLED
fi

nginx_validate=${CONTABILIDADE_NGINX_VALIDATE:-true}
case "$nginx_validate" in
  true)
    nginx -t
    ;;
  false)
    ;;
  *)
    echo "CONTABILIDADE_NGINX_VALIDATE must be exactly 'true' or 'false'." >&2
    exit 1
    ;;
esac
