/// <reference types="vite/client" />

interface ContabilidadeRuntimeConfig {
  apiBaseUrl: string;
  authEnabled: boolean;
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
}

interface Window {
  __CONTABILIDADE_CONFIG__?: ContabilidadeRuntimeConfig;
}
