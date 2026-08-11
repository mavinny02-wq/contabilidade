import { chromium, type Browser, type BrowserContext } from 'playwright';
import { config } from './config.js';

export class BrowserRuntime {
  private browser?: Browser;

  async iniciar(): Promise<void> {
    if (this.browser) return;
    this.browser = await chromium.launch({
      headless: config.headless,
      // O Chromium recusa o sandbox setuid quando o worker roda como root em
      // contêiner Linux. Usuários não-root continuam com o sandbox habilitado.
      chromiumSandbox: typeof process.getuid !== 'function' || process.getuid() !== 0,
    });
  }

  async novoContexto(): Promise<BrowserContext> {
    await this.iniciar();
    if (!this.browser) throw new Error('Browser não inicializado');
    return this.browser.newContext({
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
      acceptDownloads: true,
      viewport: { width: 1440, height: 900 },
    });
  }

  /** Contexto exclusivo para diagnósticos: nenhuma origem remota é permitida. */
  async novoContextoLocalSeguro(): Promise<BrowserContext> {
    const context = await this.novoContexto();
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      const local = url.protocol === 'about:'
        || url.protocol === 'data:'
        || (['http:', 'https:'].includes(url.protocol)
          && ['127.0.0.1', 'localhost', '::1'].includes(url.hostname));
      if (local) await route.continue();
      else await route.abort('blockedbyclient');
    });
    return context;
  }

  async saudavel(): Promise<boolean> {
    try {
      await this.iniciar();
      return this.browser?.isConnected() ?? false;
    } catch {
      return false;
    }
  }

  async fechar(): Promise<void> {
    await this.browser?.close();
    this.browser = undefined;
  }
}
