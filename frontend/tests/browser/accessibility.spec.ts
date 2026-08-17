import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const rotasRepresentativas = ['/', '/empresas', '/documentos', '/certidoes', '/console-tecnica'];

test.beforeEach(async ({ context }) => {
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:4173') await route.continue();
    else await route.abort('blockedbyclient');
  });
  await context.route('**/api/usuario-atual', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      usuario: 'smoke-local',
      nome: 'Operador local',
      papeis: [],
      permissoes: [
        'EMPRESA_LER', 'EMPRESA_EDITAR', 'DOCUMENTO_LER', 'CERTIDAO_LER',
        'CONSOLE_TECNICA_LER',
      ],
      autenticacaoAtiva: false,
    }),
  }));
});

for (const rota of rotasRepresentativas) {
  test(`${rota} nao apresenta violacoes criticas ou serias`, async ({ page }) => {
    await page.goto(rota);
    await expect(page.getByRole('main')).toBeVisible();

    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const bloqueadoras = resultado.violations.filter(
      ({ impact }) => impact === 'critical' || impact === 'serious',
    );

    expect(bloqueadoras, JSON.stringify(bloqueadoras, null, 2)).toEqual([]);
  });
}

test('navegacao principal e modal funcionam somente com teclado', async ({ page }) => {
  await page.goto('/empresas');
  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo principal' });
  await expect(skipLink).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  const trigger = page.getByRole('button', { name: 'Nova empresa' });
  if (await trigger.isVisible()) {
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});
