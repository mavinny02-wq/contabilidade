import { randomUUID } from 'node:crypto';
export const prefixo = `CODEX-E2E-${Date.now()}-${randomUUID().slice(0, 8)}`;
export function gerarCnpjFicticio() {
  const base = `${Date.now()}`.slice(-8).padStart(8, '0') + '0001';
  const dv = (valor, pesos) => { const r = valor.split('').reduce((s, n, i) => s + Number(n) * pesos[i], 0) % 11; return r < 2 ? 0 : 11 - r; };
  const d1 = dv(base, [5,4,3,2,9,8,7,6,5,4,3,2]);
  return `${base}${d1}${dv(`${base}${d1}`, [6,5,4,3,2,9,8,7,6,5,4,3,2])}`;
}
export function instalarGuardaLocal(contexto, achados) {
  return contexto.route('**/*', async rota => {
    const url = new URL(rota.request().url());
    if (url.protocol === 'data:' || ['127.0.0.1', 'localhost'].includes(url.hostname)) return rota.continue();
    achados.externas.push(url.href); await rota.abort('blockedbyclient');
  });
}
export function coletarFalhas(page, achados) {
  page.on('console', m => { if (m.type() === 'error') achados.console.push(m.text()); });
  page.on('pageerror', e => achados.console.push(e.message));
  page.on('response', r => { const u = new URL(r.url()); if (['127.0.0.1','localhost'].includes(u.hostname) && r.status() >= 500) achados.http.push(`${r.status()} ${u.pathname}`); });
  page.on('requestfailed', r => { const u = new URL(r.url()); const erro = r.failure()?.errorText ?? 'falha'; if (['127.0.0.1','localhost'].includes(u.hostname) && erro !== 'net::ERR_ABORTED') achados.requisicoes.push(`${erro} ${u.pathname}`); });
}
export async function aguardarPagina(page) { await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15000 }); await page.waitForLoadState('networkidle'); }
