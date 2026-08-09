const fallback: ContabilidadeRuntimeConfig = {
  apiBaseUrl: '/api',
  authEnabled: false,
  keycloakUrl: '/auth',
  keycloakRealm: 'contabilidade',
  keycloakClientId: 'contabilidade-frontend',
};

export const runtimeConfig: ContabilidadeRuntimeConfig = {
  ...fallback,
  ...(window.__CONTABILIDADE_CONFIG__ ?? {}),
};
