import { chromium, type Browser, type BrowserContext } from 'playwright';
import { config } from './config.js';

export class BrowserRuntime {
  private browser?: Browser;

  async iniciar(): Promise<void> {
    if (this.browser) return;
    this.browser = await chromium.launch({
      headless: config.headless,
      chromiumSandbox: true,
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
