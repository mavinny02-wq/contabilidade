import { afterEach, describe, expect, it, vi } from 'vitest';

describe('configuracao de runtime', () => {
  afterEach(() => {
    delete window.__CONTABILIDADE_CONFIG__;
    vi.resetModules();
  });

  it('usa defaults seguros com autenticacao desabilitada', async () => {
    const { runtimeConfig } = await import('./runtime');
    expect(runtimeConfig).toEqual({
      apiBaseUrl: '/api',
      authEnabled: false,
      keycloakUrl: '/auth',
      keycloakRealm: 'contabilidade',
      keycloakClientId: 'contabilidade-frontend',
    });
  });

  it('preserva defaults nao substituidos pela configuracao externa', async () => {
    window.__CONTABILIDADE_CONFIG__ = { apiBaseUrl: '/api-interna', authEnabled: true };
    const { runtimeConfig } = await import('./runtime');
    expect(runtimeConfig.apiBaseUrl).toBe('/api-interna');
    expect(runtimeConfig.authEnabled).toBe(true);
    expect(runtimeConfig.keycloakRealm).toBe('contabilidade');
  });
});
