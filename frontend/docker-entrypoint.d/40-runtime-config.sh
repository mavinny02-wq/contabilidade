#!/bin/sh
set -eu

cat > /usr/share/nginx/html/config.js <<EOF
window.__CONTABILIDADE_CONFIG__ = {
  apiBaseUrl: '${APP_API_BASE_URL:-/api}',
  authEnabled: ${APP_AUTH_ENABLED:-false},
  keycloakUrl: '${APP_KEYCLOAK_URL:-/auth}',
  keycloakRealm: '${APP_KEYCLOAK_REALM:-contabilidade}',
  keycloakClientId: '${APP_KEYCLOAK_CLIENT_ID:-contabilidade-frontend}'
};
EOF
