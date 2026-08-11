import { writeFile } from 'node:fs/promises';
import { chromium } from '../../automation-worker/node_modules/playwright/index.mjs';
import { aguardarPagina, coletarFalhas, gerarCnpjFicticio, instalarGuardaLocal, prefixo } from './e2e-helpers.mjs';
const baseUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';
const achados = { console: [], externas: [], http: [], requisicoes: [] };
const browser = await chromium.launch({ headless: true, chromiumSandbox: false }); const contexto = await browser.newContext({ acceptDownloads: true });
await instalarGuardaLocal(contexto, achados); const page = await contexto.newPage(); coletarFalhas(page, achados);
try {
  await page.goto(`${baseUrl}/`); await aguardarPagina(page);
  await page.goto(`${baseUrl}/empresas`); await aguardarPagina(page);
  await page.getByRole('button', { name: /Nova empresa/i }).first().click();
  await page.getByLabel('Razão social', { exact: true }).fill(`${prefixo} EMPRESA FICTÍCIA`); await page.getByLabel(/Nome fantasia/i).fill(prefixo);
  await page.getByLabel('CNPJ', { exact: true }).fill(gerarCnpjFicticio()); await page.getByLabel(/Município/i).fill('São Paulo'); await page.getByLabel(/^UF$/i).fill('SP');
  const [respostaCriacao] = await Promise.all([
    page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/empresas'),
    page.getByRole('button', { name: /^Salvar$/i }).click(),
  ]);
  if (!respostaCriacao.ok()) throw new Error(`Criação da empresa falhou: HTTP ${respostaCriacao.status()} ${await respostaCriacao.text()}`);
  await page.waitForURL(/\/empresas\/[0-9a-f-]+$/i); const empresaId = page.url().split('/').pop(); await aguardarPagina(page);
  const rotas = [`/empresas/${empresaId}/responsaveis-modulo`, `/documentos?empresaId=${empresaId}`, '/certidoes', '/certidoes/agenda', '/execucoes', '/intervencoes', '/notificacoes', '/integracoes', '/integracoes/historico-provedores', '/integracoes/faturas', '/auditoria', '/backups', '/configuracao-segura', '/atualizacoes', '/console-tecnica', '/console-tecnica/workers/historico'];
  for (const rota of rotas) { await page.goto(`${baseUrl}${rota}`); await aguardarPagina(page); if (rota.startsWith('/documentos')) { await writeFile('/tmp/codex-e2e-documento.txt', `${prefixo}\nDocumento sintético local.\n`); await page.locator('input[type=file]').setInputFiles('/tmp/codex-e2e-documento.txt'); await page.getByRole('button', { name: /^Enviar$/i }).click(); await page.getByText('codex-e2e-documento.txt').waitFor(); } }
  await page.goto(`${baseUrl}/empresas/${empresaId}`); await page.reload(); await aguardarPagina(page); await page.screenshot({ path: '/tmp/contabilidade-codex-e2e.png', fullPage: true });
  const falhas = Object.entries(achados).filter(([, itens]) => itens.length); if (falhas.length) throw new Error(`Achados do navegador: ${JSON.stringify(Object.fromEntries(falhas))}`);
  console.log(`Smoke Playwright aprovado: ${rotas.length + 3} jornadas; ${prefixo}; zero chamadas externas.`);
} finally { await browser.close(); }
