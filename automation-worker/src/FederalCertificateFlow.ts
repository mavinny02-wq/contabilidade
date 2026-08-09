import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Locator, Page, Response } from 'playwright';
import { config } from './config.js';
import type {
  ContextoFluxoPortal,
  FluxoPortal,
  ResultadoFluxo,
} from './contracts.js';
import { parseFederalCertificate } from './PdfCertificateParser.js';

const OPERACAO = 'CERTIDAO_FEDERAL_RFB_PGFN';
const PROVEDOR = 'FEDERAL_PORTAL';
const MAX_INTERVENCOES = 2;

export class FederalCertificateFlow implements FluxoPortal {
  readonly modo = 'PORTAL' as const;
  readonly operacao = OPERACAO;
  readonly provedorCodigo = PROVEDOR;

  async executar(contexto: ContextoFluxoPortal): Promise<ResultadoFluxo> {
    const cnpj = requiredString(contexto.parametros.cnpj, 'CNPJ_AUSENTE_NO_PAYLOAD')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const acompanhamentoId = requiredString(
      contexto.parametros.acompanhamentoId,
      'ACOMPANHAMENTO_AUSENTE_NO_PAYLOAD',
    );
    const empresaId = contexto.empresaId
      ?? requiredString(contexto.parametros.empresaId, 'EMPRESA_AUSENTE_NO_PAYLOAD');
    const permitirIntervencao = Boolean(contexto.parametros.permitirIntervencao);
    const timeoutHumanoMinutos = boundedInteger(
      contexto.parametros.timeoutHumanoMinutos,
      30,
      1,
      120,
    );

    contexto.page.setDefaultTimeout(config.federalNavigationTimeoutMs);
    contexto.page.setDefaultNavigationTimeout(config.federalNavigationTimeoutMs);

    try {
      await contexto.page.goto(config.federalPortalUrl, {
        waitUntil: 'domcontentloaded',
        timeout: config.federalNavigationTimeoutMs,
      });
      await waitForPortalShell(contexto.page);
    } catch (error) {
      return unavailable('PORTAL_FEDERAL_INDISPONIVEL', error);
    }

    const unavailableMessage = await detectUnavailable(contexto.page);
    if (unavailableMessage) {
      return {
        status: 'FONTE_INDISPONIVEL',
        erroCodigo: 'PORTAL_FEDERAL_INDISPONIVEL',
        erroResumo: unavailableMessage,
        retryable: true,
      };
    }

    const input = await findCnpjInput(contexto.page);
    if (!input) {
      return portalChanged(
        'CAMPO_CNPJ_NAO_ENCONTRADO',
        'O portal federal não apresentou um campo identificável para o CNPJ.',
      );
    }
    await input.fill(cnpj);

    let intervencoes = 0;
    while (await captchaPresent(contexto.page)) {
      if (await captchaSolved(contexto.page)) break;
      if (!permitirIntervencao) {
        return portalChanged(
          'CAPTCHA_REQUER_INTERVENCAO',
          'O portal federal exige validação humana e a política não permite intervenção.',
        );
      }
      if (intervencoes >= MAX_INTERVENCOES) {
        return portalChanged(
          'CAPTCHA_NAO_CONCLUIDO',
          'A validação humana do portal não foi concluída após duas intervenções.',
        );
      }
      intervencoes += 1;
      await contexto.intervencao.aguardar({
        tipo: 'CAPTCHA',
        codigo: 'CAPTCHA_FEDERAL_NECESSARIO',
        resumo: 'O portal da Receita Federal solicitou validação humana.',
        tituloKey: 'certidoes.intervencaoFederalCaptcha.titulo',
        instrucaoKey: intervencoes === 1
          ? 'certidoes.intervencaoFederalCaptcha.instrucao'
          : 'certidoes.intervencaoFederalCaptcha.instrucaoNovaTentativa',
        timeoutMinutos: timeoutHumanoMinutos,
      });
      await contexto.page.waitForTimeout(800);
    }

    const submit = await findSubmitButton(contexto.page);
    if (!submit) {
      return portalChanged(
        'BOTAO_EMITIR_NAO_ENCONTRADO',
        'O portal federal não apresentou um comando identificável para emitir a certidão.',
      );
    }

    const capture = capturePortalOutcome(contexto.page, contexto.execucaoId);
    try {
      await submit.click();
    } catch (error) {
      return portalChanged('BOTAO_EMITIR_NAO_ACIONADO', safeError(error));
    }

    let outcome = await capture;

    if (outcome.kind === 'captcha') {
      if (!permitirIntervencao || intervencoes >= MAX_INTERVENCOES) {
        return portalChanged(
          'CAPTCHA_FEDERAL_REJEITADO',
          'O portal solicitou uma nova validação humana após a emissão.',
        );
      }
      intervencoes += 1;
      await contexto.intervencao.aguardar({
        tipo: 'CAPTCHA',
        codigo: 'CAPTCHA_FEDERAL_NECESSARIO',
        resumo: 'O portal solicitou uma nova validação antes de gerar o documento.',
        tituloKey: 'certidoes.intervencaoFederalCaptcha.titulo',
        instrucaoKey: 'certidoes.intervencaoFederalCaptcha.instrucaoNovaTentativa',
        timeoutMinutos: timeoutHumanoMinutos,
      });
      const retryCapture = capturePortalOutcome(contexto.page, contexto.execucaoId);
      const retryButton = await findSubmitButton(contexto.page);
      if (!retryButton) {
        return portalChanged(
          'BOTAO_EMITIR_NAO_ENCONTRADO_APOS_CAPTCHA',
          'O comando de emissão desapareceu após a validação humana.',
        );
      }
      await retryButton.click();
      outcome = await retryCapture;
    }

    if (outcome.kind === 'incomplete') {
      return {
        status: 'SUCESSO',
        dados: {
          acompanhamentoId,
          resultado: 'INCOMPLETA',
          mensagemFonte: outcome.message,
        },
        custo: 0,
        moeda: 'BRL',
      };
    }

    if (outcome.kind === 'unavailable') {
      return {
        status: 'FONTE_INDISPONIVEL',
        erroCodigo: 'PORTAL_FEDERAL_INDISPONIVEL',
        erroResumo: outcome.message,
        retryable: true,
      };
    }

    if (outcome.kind === 'portal-changed') {
      return portalChanged('PORTAL_FEDERAL_ALTERADO', outcome.message);
    }

    if (outcome.kind === 'timeout') {
      return {
        status: 'FALHA',
        erroCodigo: 'TIMEOUT_RESULTADO_FEDERAL',
        erroResumo: 'O portal não apresentou PDF nem resultado conclusivo dentro do tempo esperado.',
        retryable: true,
      };
    }

    if (outcome.kind === 'captcha') {
      return portalChanged(
        'CAPTCHA_FEDERAL_NAO_CONCLUIDO',
        'O portal continuou solicitando validação humana após o limite configurado.',
      );
    }

    const pdfPath = outcome.filePath;
    try {
      const parsed = await parseFederalCertificate(pdfPath);
      if (parsed.cnpj && normalizeIdentifier(parsed.cnpj) !== cnpj) {
        return portalChanged(
          'DOCUMENTO_CNPJ_DIVERGENTE',
          'O CNPJ extraído do documento não corresponde ao estabelecimento consultado.',
        );
      }

      const upload = await contexto.documentos.enviar({
        empresaId,
        tipo: 'CERTIDAO',
        origem: intervencoes > 0 ? 'PORTAL_ASSISTIDO' : 'PORTAL_AUTOMATIZADO',
        arquivoPath: pdfPath,
        mimeType: 'application/pdf',
        nomeArquivo: `certidao-federal-${cnpj}.pdf`,
        emitidoEm: parsed.issuedAt,
        validoAte: parsed.validUntil,
      });

      return {
        status: 'SUCESSO',
        protocoloExterno: parsed.number,
        dados: {
          acompanhamentoId,
          resultado: parsed.result,
          numeroCertidao: parsed.number,
          emitidaEm: parsed.issuedAt,
          validaAte: parsed.validUntil,
          documentoId: upload.id,
          mensagemFonte: parsed.sourceMessage,
        },
        custo: 0,
        moeda: 'BRL',
      };
    } catch (error) {
      return {
        status: 'FALHA',
        erroCodigo: 'PDF_FEDERAL_NAO_PROCESSADO',
        erroResumo: safeError(error),
        retryable: false,
      };
    } finally {
      await unlink(pdfPath).catch(() => undefined);
    }
  }
}

type PortalOutcome =
  | { kind: 'pdf'; filePath: string }
  | { kind: 'incomplete'; message: string }
  | { kind: 'unavailable'; message: string }
  | { kind: 'captcha' }
  | { kind: 'portal-changed'; message: string }
  | { kind: 'timeout' };

async function capturePortalOutcome(
  page: Page,
  executionId: string,
): Promise<PortalOutcome> {
  const download = captureDownload(page, executionId);
  const response = capturePdfResponse(page, executionId);
  const popup = capturePopup(page, executionId);
  const dom = observeDom(page, executionId);

  try {
    return await Promise.any([download, response, popup, dom]);
  } catch {
    return { kind: 'timeout' };
  }
}

async function captureDownload(page: Page, executionId: string): Promise<PortalOutcome> {
  const download = await page.waitForEvent('download', {
    timeout: config.federalResultTimeoutMs,
  });
  const path = await tempPdfPath(executionId);
  await download.saveAs(path);
  await assertPdf(path);
  return { kind: 'pdf', filePath: path };
}

async function capturePdfResponse(page: Page, executionId: string): Promise<PortalOutcome> {
  const response = await page.waitForResponse(
    (candidate) => isPdfResponse(candidate),
    { timeout: config.federalResultTimeoutMs },
  );
  const body = await response.body();
  if (!isPdfBytes(body)) throw new Error('Resposta marcada como PDF sem assinatura PDF.');
  const path = await tempPdfPath(executionId);
  await writeFile(path, body);
  return { kind: 'pdf', filePath: path };
}

async function capturePopup(page: Page, executionId: string): Promise<PortalOutcome> {
  const popup = await page.context().waitForEvent('page', {
    timeout: config.federalResultTimeoutMs,
  });
  await popup.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => undefined);
  const url = popup.url();
  if (url && !url.startsWith('about:') && !url.startsWith('blob:')) {
    const response = await popup.request.get(url, { timeout: 30_000 }).catch(() => undefined);
    if (response?.ok()) {
      const bytes = Buffer.from(await response.body());
      if (isPdfBytes(bytes)) {
        const path = await tempPdfPath(executionId);
        await writeFile(path, bytes);
        await popup.close().catch(() => undefined);
        return { kind: 'pdf', filePath: path };
      }
    }
  }

  const blobBytes = await readPdfFromPopupBlob(popup).catch(() => undefined);
  if (blobBytes && isPdfBytes(blobBytes)) {
    const path = await tempPdfPath(executionId);
    await writeFile(path, blobBytes);
    await popup.close().catch(() => undefined);
    return { kind: 'pdf', filePath: path };
  }

  await popup.close().catch(() => undefined);
  throw new Error('Popup não continha bytes de um PDF oficial reconhecível.');
}

async function observeDom(page: Page, executionId: string): Promise<PortalOutcome> {
  const deadline = Date.now() + config.federalResultTimeoutMs;
  let linkProcessed = false;

  while (Date.now() < deadline) {
    const rawText = await page.locator('body').innerText().catch(() => '');
    const text = normalize(rawText);

    if (insufficientInformation(text)) {
      return {
        kind: 'incomplete',
        message:
          'As informações disponíveis na RFB e/ou PGFN são insuficientes para emissão da certidão pela internet.',
      };
    }
    if (unavailableText(text)) {
      return {
        kind: 'unavailable',
        message: firstSafeSentence(rawText) || 'O portal federal está indisponível.',
      };
    }
    if (await captchaPresent(page) && captchaErrorText(text)) {
      return { kind: 'captcha' };
    }

    if (!linkProcessed) {
      const pdfLink = await findPdfLink(page);
      if (pdfLink) {
        linkProcessed = true;
        const direct = await downloadFromLink(page, pdfLink, executionId);
        if (direct) return { kind: 'pdf', filePath: direct };
        await pdfLink.click().catch(() => undefined);
      }
    }

    if (
      text.includes('CERTIDAO NEGATIVA DE DEBITOS RELATIVOS')
      || text.includes('CERTIDAO POSITIVA COM EFEITOS DE NEGATIVA')
    ) {
      const blobBytes = await readPdfFromPageBlob(page).catch(() => undefined);
      if (blobBytes && isPdfBytes(blobBytes)) {
        const path = await tempPdfPath(executionId);
        await writeFile(path, blobBytes);
        return { kind: 'pdf', filePath: path };
      }
      return {
        kind: 'portal-changed',
        message: 'O portal exibiu uma certidão, mas não disponibilizou os bytes do PDF oficial.',
      };
    }

    await page.waitForTimeout(500);
  }
  throw new Error('Tempo de observação do DOM excedido.');
}

async function waitForPortalShell(page: Page): Promise<void> {
  const deadline = Date.now() + config.federalNavigationTimeoutMs;
  while (Date.now() < deadline) {
    const text = normalize(await page.locator('body').innerText().catch(() => ''));
    if (
      text.includes('CERTIDAO DE REGULARIDADE FISCAL')
      || text.includes('PESSOA JURIDICA')
      || text.includes('CNPJ')
    ) {
      return;
    }
    await page.waitForTimeout(400);
  }
  throw new Error('A estrutura principal do portal não foi apresentada.');
}

async function findCnpjInput(page: Page): Promise<Locator | undefined> {
  const direct = await firstVisible([
    page.getByRole('textbox', { name: /CNPJ/i }),
    page.getByLabel(/CNPJ/i),
    page.locator('input[aria-label*="CNPJ" i]'),
    page.locator('input[placeholder*="CNPJ" i]'),
    page.locator('input[placeholder*="00.000" i]'),
    page.locator('input[name*="cnpj" i]'),
    page.locator('input[id*="cnpj" i]'),
  ]);
  if (direct) return direct;

  const openForm = await firstVisible([
    page.getByRole('button', { name: /emitir certid[aã]o atualizada/i }),
    page.getByRole('link', { name: /emitir certid[aã]o atualizada/i }),
    page.getByRole('button', { name: /emitir certid[aã]o/i }),
    page.getByText(/Pessoa Jur[ií]dica/i, { exact: true }),
  ]);
  if (openForm) {
    await openForm.click();
    await page.waitForTimeout(500);
    return firstVisible([
      page.getByRole('textbox', { name: /CNPJ/i }),
      page.getByLabel(/CNPJ/i),
      page.locator('input[placeholder*="CNPJ" i]'),
      page.locator('input[name*="cnpj" i]'),
      page.locator('input[id*="cnpj" i]'),
    ]);
  }
  return undefined;
}

async function findSubmitButton(page: Page): Promise<Locator | undefined> {
  return firstVisible([
    page.getByRole('button', { name: /^emitir certid[aã]o$/i }),
    page.getByRole('button', { name: /emitir certid[aã]o atualizada/i }),
    page.getByRole('button', { name: /^emitir$/i }),
    page.getByRole('button', { name: /^consultar$/i }),
    page.locator('button[type="submit"]'),
  ]);
}

async function firstVisible(locators: Locator[]): Promise<Locator | undefined> {
  for (const locator of locators) {
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < Math.min(count, 5); index += 1) {
      const candidate = locator.nth(index);
      if (await candidate.isVisible().catch(() => false)) return candidate;
    }
  }
  return undefined;
}

export async function captchaPresent(page: Page): Promise<boolean> {
  const locators = [
    page.locator('iframe[src*="hcaptcha" i]'),
    page.locator('iframe[src*="recaptcha" i]'),
    page.locator('iframe[src*="turnstile" i]'),
    page.locator('iframe[title*="captcha" i]'),
    page.locator('.h-captcha, .g-recaptcha, [data-sitekey]'),
  ];
  for (const locator of locators) {
    if (await locator.count().catch(() => 0)) return true;
  }
  const text = normalize(await page.locator('body').innerText().catch(() => ''));
  return text.includes('NAO SOU UM ROBO')
    || text.includes('DESAFIO HCAPTCHA')
    || text.includes('DESAFIO DE SEGURANCA');
}

async function captchaSolved(page: Page): Promise<boolean> {
  const selectors = [
    'textarea[name="h-captcha-response"]',
    'textarea[name="g-recaptcha-response"]',
    'input[name="cf-turnstile-response"]',
  ];
  for (const selector of selectors) {
    const values = await page.locator(selector).evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLInputElement | HTMLTextAreaElement).value ?? ''),
    ).catch(() => [] as string[]);
    if (values.some((value) => value.trim().length > 20)) return true;
  }
  return false;
}

async function findPdfLink(page: Page): Promise<Locator | undefined> {
  return firstVisible([
    page.locator('a[href$=".pdf" i]'),
    page.locator('a[href*="pdf" i]'),
    page.getByRole('link', { name: /baixar|download|certid[aã]o|segunda via/i }),
    page.getByRole('button', { name: /baixar|download|certid[aã]o/i }),
  ]);
}

async function downloadFromLink(
  page: Page,
  link: Locator,
  executionId: string,
): Promise<string | undefined> {
  const href = await link.getAttribute('href').catch(() => null);
  if (!href || href.startsWith('blob:') || href.startsWith('javascript:')) return undefined;
  const url = new URL(href, page.url()).toString();
  const response = await page.request.get(url, { timeout: 30_000 }).catch(() => undefined);
  if (!response?.ok()) return undefined;
  const bytes = Buffer.from(await response.body());
  if (!isPdfBytes(bytes)) return undefined;
  const path = await tempPdfPath(executionId);
  await writeFile(path, bytes);
  return path;
}

async function readPdfFromPopupBlob(page: Page): Promise<Buffer | undefined> {
  return readPdfFromPageBlob(page);
}

async function readPdfFromPageBlob(page: Page): Promise<Buffer | undefined> {
  const candidates = await page.evaluate(async () => {
    const urls = new Set<string>();
    if (location.href.startsWith('blob:')) urls.add(location.href);
    document.querySelectorAll('embed[src], iframe[src], object[data], a[href]').forEach((node) => {
      const value = node instanceof HTMLObjectElement
        ? node.data
        : node.getAttribute('src') ?? node.getAttribute('href');
      if (value?.startsWith('blob:')) urls.add(value);
    });
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (
          bytes.length >= 5
          && bytes[0] === 0x25
          && bytes[1] === 0x50
          && bytes[2] === 0x44
          && bytes[3] === 0x46
          && bytes[4] === 0x2d
        ) {
          return Array.from(bytes);
        }
      } catch {
        // Continua procurando outro blob no mesmo documento.
      }
    }
    return undefined;
  });
  return candidates ? Buffer.from(candidates) : undefined;
}

async function tempPdfPath(executionId: string): Promise<string> {
  const directory = join(config.downloadDirectory, executionId);
  await mkdir(directory, { recursive: true });
  return join(directory, `${Date.now()}-${randomUUID()}.pdf`);
}

async function assertPdf(path: string): Promise<void> {
  const bytes = await readFile(path);
  if (!isPdfBytes(bytes)) throw new Error('Arquivo baixado não possui assinatura PDF.');
}

function isPdfResponse(response: Response): boolean {
  const contentType = response.headers()['content-type']?.toLowerCase() ?? '';
  return contentType.includes('application/pdf')
    || /\.pdf(?:$|[?#])/i.test(response.url());
}

function isPdfBytes(bytes: Uint8Array): boolean {
  return bytes.length >= 5
    && bytes[0] === 0x25
    && bytes[1] === 0x50
    && bytes[2] === 0x44
    && bytes[3] === 0x46
    && bytes[4] === 0x2d;
}

async function detectUnavailable(page: Page): Promise<string | undefined> {
  const raw = await page.locator('body').innerText().catch(() => '');
  return unavailableText(normalize(raw))
    ? firstSafeSentence(raw) || 'O portal federal está indisponível.'
    : undefined;
}

function insufficientInformation(text: string): boolean {
  return text.includes('INFORMACOES DISPONIVEIS NOS SISTEMAS DA RECEITA FEDERAL')
    && text.includes('INSUFICIENTES PARA EMISSAO DE CERTIDAO');
}

function unavailableText(text: string): boolean {
  return [
    'SERVICO INDISPONIVEL',
    'SISTEMA INDISPONIVEL',
    'TEMPORARIAMENTE INDISPONIVEL',
    'TENTE NOVAMENTE MAIS TARDE',
    'ERRO AO PROCESSAR A SOLICITACAO',
    'NAO FOI POSSIVEL ACESSAR O SERVICO',
  ].some((marker) => text.includes(marker));
}

function captchaErrorText(text: string): boolean {
  return [
    'CAPTCHA INVALIDO',
    'VALIDACAO DE SEGURANCA',
    'CONFIRME QUE VOCE NAO E UM ROBO',
    'DESAFIO EXPIRADO',
  ].some((marker) => text.includes(marker));
}

function portalChanged(code: string, message: string): ResultadoFluxo {
  return {
    status: 'FALHA',
    erroCodigo: code,
    erroResumo: message,
    retryable: false,
  };
}

function unavailable(code: string, error: unknown): ResultadoFluxo {
  return {
    status: 'FONTE_INDISPONIVEL',
    erroCodigo: code,
    erroResumo: safeError(error),
    retryable: true,
  };
}

function requiredString(value: unknown, code: string): string {
  const text = value == null ? '' : String(value).trim();
  if (!text) throw new Error(code);
  return text;
}

function boundedInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

function normalizeIdentifier(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function firstSafeSentence(value: string): string | undefined {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (!clean) return undefined;
  return clean.slice(0, 500);
}

function safeError(error: unknown): string {
  return error instanceof Error
    ? `${error.name}: ${error.message}`.slice(0, 500)
    : String(error).slice(0, 500);
}
