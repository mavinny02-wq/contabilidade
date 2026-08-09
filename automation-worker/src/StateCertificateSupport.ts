import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Download, Locator, Page, Response } from 'playwright';

export type StatePortalOutcome =
  | { kind: 'pdf'; filePath: string }
  | { kind: 'business-blocked'; code: string; message: string }
  | { kind: 'unavailable'; message: string }
  | { kind: 'captcha' }
  | { kind: 'portal-changed'; message: string }
  | { kind: 'timeout' };

export type DomObserver = (
  page: Page,
  rawText: string,
  normalizedText: string,
  state: { documentActionClicked: boolean },
) => Promise<StatePortalOutcome | undefined>;

export type CaptureOptions = {
  executionId: string;
  resultTimeoutMs: number;
  downloadDirectory: string;
  observe: DomObserver;
  trigger?: () => Promise<void>;
  triggerErrorPrefix?: string;
};

export async function captureStatePortalOutcome(
  page: Page,
  options: CaptureOptions,
): Promise<StatePortalOutcome> {
  return await new Promise<StatePortalOutcome>((resolve) => {
    let settled = false;
    let timer: NodeJS.Timeout | undefined;
    const state = { documentActionClicked: false };
    const context = page.context();

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      page.off('download', onDownload);
      page.off('response', onResponse);
      context.off('page', onPopup);
    };

    const finish = (outcome: StatePortalOutcome) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(outcome);
    };

    const acceptPdf = async (path: string) => {
      try {
        await assertPdf(path);
        if (settled) {
          await unlink(path).catch(() => undefined);
          return;
        }
        finish({ kind: 'pdf', filePath: path });
      } catch {
        await unlink(path).catch(() => undefined);
      }
    };

    const onDownload = (download: Download) => {
      void (async () => {
        if (settled) return;
        const path = await tempPdfPath(options.executionId, options.downloadDirectory);
        try {
          await download.saveAs(path);
          await acceptPdf(path);
        } catch {
          await unlink(path).catch(() => undefined);
        }
      })();
    };

    const onResponse = (response: Response) => {
      void (async () => {
        if (settled || !isPdfResponse(response)) return;
        try {
          const body = Buffer.from(await response.body());
          if (!isPdfBytes(body)) return;
          const path = await savePdfBytes(
            options.executionId,
            options.downloadDirectory,
            body,
          );
          if (settled) {
            await unlink(path).catch(() => undefined);
            return;
          }
          finish({ kind: 'pdf', filePath: path });
        } catch {
          // A resposta pode ser opaca ou ter sido cancelada; outras estratégias continuam.
        }
      })();
    };

    const onPopup = (popup: Page) => {
      void (async () => {
        if (settled) {
          await popup.close().catch(() => undefined);
          return;
        }
        try {
          await popup.waitForLoadState('domcontentloaded', { timeout: 30_000 })
            .catch(() => undefined);
          const url = popup.url();
          if (url && !url.startsWith('about:') && !url.startsWith('blob:')) {
            const response = await popup.request.get(url, { timeout: 30_000 })
              .catch(() => undefined);
            if (response?.ok()) {
              const bytes = Buffer.from(await response.body());
              if (isPdfBytes(bytes)) {
                const path = await savePdfBytes(
                  options.executionId,
                  options.downloadDirectory,
                  bytes,
                );
                if (settled) await unlink(path).catch(() => undefined);
                else finish({ kind: 'pdf', filePath: path });
                return;
              }
            }
          }
          const blob = await readPdfFromPageBlob(popup).catch(() => undefined);
          if (blob && isPdfBytes(blob)) {
            const path = await savePdfBytes(
              options.executionId,
              options.downloadDirectory,
              blob,
            );
            if (settled) await unlink(path).catch(() => undefined);
            else finish({ kind: 'pdf', filePath: path });
          }
        } finally {
          await popup.close().catch(() => undefined);
        }
      })();
    };

    page.on('download', onDownload);
    page.on('response', onResponse);
    context.on('page', onPopup);

    timer = setTimeout(() => finish({ kind: 'timeout' }), options.resultTimeoutMs);

    if (options.trigger) {
      void options.trigger().catch((error) => {
        finish({
          kind: 'portal-changed',
          message: `${options.triggerErrorPrefix ?? 'Não foi possível acionar o portal'}: ${safeError(error)}`,
        });
      });
    }

    void (async () => {
      while (!settled) {
        const rawText = await page.locator('body').innerText().catch(() => '');
        const outcome = await options.observe(page, rawText, normalize(rawText), state)
          .catch(() => undefined);
        if (outcome) {
          finish(outcome);
          return;
        }
        await page.waitForTimeout(500).catch(() => undefined);
      }
    })();
  });
}

export async function firstVisible(locators: Locator[]): Promise<Locator | undefined> {
  for (const locator of locators) {
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < Math.min(count, 12); index += 1) {
      const candidate = locator.nth(index);
      if (await candidate.isVisible().catch(() => false)) return candidate;
    }
  }
  return undefined;
}

export async function findVisibleInput(
  page: Page,
  options: {
    direct: Locator[];
    keywords: string[];
    preferredMaxLengths?: number[];
  },
): Promise<Locator | undefined> {
  const direct = await firstVisible(options.direct);
  if (direct) return direct;

  const inputs = page.locator(
    'input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]):not([type="submit"]):not([type="button"]):not([type="image"])',
  );
  const count = Math.min(await inputs.count().catch(() => 0), 40);
  let best: { locator: Locator; score: number } | undefined;

  for (let index = 0; index < count; index += 1) {
    const candidate = inputs.nth(index);
    if (!await candidate.isVisible().catch(() => false)) continue;
    const metadata = await candidate.evaluate((element) => {
      const input = element as HTMLInputElement;
      const label = input.labels ? Array.from(input.labels).map((item) => item.textContent ?? '').join(' ') : '';
      const parent = input.parentElement?.textContent ?? '';
      const grandparent = input.parentElement?.parentElement?.textContent ?? '';
      return {
        id: input.id ?? '',
        name: input.name ?? '',
        placeholder: input.placeholder ?? '',
        aria: input.getAttribute('aria-label') ?? '',
        maxLength: input.maxLength,
        label,
        surrounding: `${parent} ${grandparent}`.slice(0, 1000),
      };
    }).catch(() => undefined);
    if (!metadata) continue;

    const searchable = normalize([
      metadata.id,
      metadata.name,
      metadata.placeholder,
      metadata.aria,
      metadata.label,
      metadata.surrounding,
    ].join(' '));
    let score = 0;
    for (const keyword of options.keywords) {
      const normalizedKeyword = normalize(keyword);
      if (normalize(metadata.id).includes(normalizedKeyword)) score += 80;
      if (normalize(metadata.name).includes(normalizedKeyword)) score += 70;
      if (normalize(metadata.placeholder).includes(normalizedKeyword)) score += 60;
      if (normalize(metadata.aria).includes(normalizedKeyword)) score += 60;
      if (normalize(metadata.label).includes(normalizedKeyword)) score += 70;
      if (searchable.includes(normalizedKeyword)) score += 20;
    }
    if (options.preferredMaxLengths?.includes(metadata.maxLength)) score += 25;
    if (!best || score > best.score) best = { locator: candidate, score };
  }

  return best && best.score >= 20 ? best.locator : undefined;
}

export async function fillIdentifier(locator: Locator, value: string): Promise<void> {
  await locator.fill(value);
  const current = normalizeIdentifier(await locator.inputValue().catch(() => ''));
  if (current === normalizeIdentifier(value)) return;
  await locator.click();
  await locator.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A').catch(() => undefined);
  await locator.type(value, { delay: 25 });
}

export async function selectRadioByLabel(
  page: Page,
  label: RegExp,
  fallbackValues: string[] = [],
): Promise<boolean> {
  const direct = await firstVisible([
    page.getByRole('radio', { name: label }),
    page.getByLabel(label),
  ]);
  if (direct) {
    const type = await direct.getAttribute('type').catch(() => null);
    if (type?.toLowerCase() === 'radio') {
      await direct.check().catch(() => direct.click());
      return true;
    }
  }

  for (const value of fallbackValues) {
    const fallback = await firstVisible([
      page.locator(`input[type="radio"][value="${cssEscape(value)}" i]`),
      page.locator(`input[type="radio"][id*="${cssEscape(value)}" i]`),
      page.locator(`input[type="radio"][name*="${cssEscape(value)}" i]`),
    ]);
    if (fallback) {
      await fallback.check().catch(() => fallback.click());
      return true;
    }
  }
  return false;
}

export async function findAction(
  page: Page,
  names: RegExp,
): Promise<Locator | undefined> {
  const semantic = await firstVisible([
    page.getByRole('button', { name: names }),
    page.getByRole('link', { name: names }),
  ]);
  if (semantic) return semantic;

  const inputs = page.locator(
    'input[type="submit"], input[type="button"], input[type="image"]',
  );
  const count = Math.min(await inputs.count().catch(() => 0), 30);
  const visible: Locator[] = [];
  for (let index = 0; index < count; index += 1) {
    const candidate = inputs.nth(index);
    if (!await candidate.isVisible().catch(() => false)) continue;
    visible.push(candidate);
    const text = await candidate.evaluate((element) => {
      const input = element as HTMLInputElement;
      return [
        input.value ?? '',
        element.getAttribute('alt') ?? '',
        element.getAttribute('title') ?? '',
        element.getAttribute('aria-label') ?? '',
      ].join(' ');
    }).catch(() => '');
    names.lastIndex = 0;
    if (names.test(text)) return candidate;
  }

  // Alguns portais antigos usam uma única imagem submit sem texto acessível.
  return visible.length === 1 ? visible[0] : undefined;
}

export async function captchaPresent(page: Page): Promise<boolean> {
  const locators = [
    page.locator('iframe[src*="hcaptcha" i]'),
    page.locator('iframe[src*="recaptcha" i]'),
    page.locator('iframe[src*="turnstile" i]'),
    page.locator('iframe[title*="captcha" i]'),
    page.locator('.h-captcha, .g-recaptcha, [data-sitekey]'),
    page.locator('img[src*="captcha" i]'),
    page.locator('input[name*="captcha" i], input[id*="captcha" i]'),
  ];
  for (const locator of locators) {
    if (await locator.count().catch(() => 0)) return true;
  }
  const text = normalize(await page.locator('body').innerText().catch(() => ''));
  return [
    'NAO SOU UM ROBO',
    'RECAPTCHA',
    'CAPTCHA',
    'DESAFIO DE SEGURANCA',
    'VERIFICACAO DE SEGURANCA',
  ].some((marker) => text.includes(marker));
}

export async function captchaSolved(page: Page): Promise<boolean> {
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

export async function findDocumentAction(page: Page): Promise<Locator | undefined> {
  return firstVisible([
    page.locator('a[href$=".pdf" i]'),
    page.locator('a[href*="pdf" i]'),
    page.getByRole('link', { name: /baixar|download|imprimir|visualizar|reemitir|certid[aã]o/i }),
    page.getByRole('button', { name: /baixar|download|imprimir|visualizar|reemitir|certid[aã]o/i }),
    page.locator('input[type="submit"][value*="imprimir" i]'),
    page.locator('input[type="button"][value*="imprimir" i]'),
  ]);
}

export async function downloadDocumentAction(
  page: Page,
  action: Locator,
  options: Pick<CaptureOptions, 'executionId' | 'downloadDirectory'>,
): Promise<string | undefined> {
  const href = await action.getAttribute('href').catch(() => null);
  if (!href || href.startsWith('blob:') || href.startsWith('javascript:')) return undefined;
  const url = new URL(href, page.url()).toString();
  const response = await page.request.get(url, { timeout: 30_000 }).catch(() => undefined);
  if (!response?.ok()) return undefined;
  const bytes = Buffer.from(await response.body());
  if (!isPdfBytes(bytes)) return undefined;
  const path = await tempPdfPath(options.executionId, options.downloadDirectory);
  await writeFile(path, bytes);
  return path;
}

export async function readPdfFromPageBlob(page: Page): Promise<Buffer | undefined> {
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
        // Continua procurando outro blob no documento.
      }
    }
    return undefined;
  });
  return candidates ? Buffer.from(candidates) : undefined;
}

export async function savePdfBytes(
  executionId: string,
  downloadDirectory: string,
  bytes: Uint8Array,
): Promise<string> {
  if (!isPdfBytes(bytes)) {
    throw new Error('Os bytes recebidos não possuem assinatura PDF.');
  }
  const path = await tempPdfPath(executionId, downloadDirectory);
  await writeFile(path, bytes);
  return path;
}

export async function assertPdf(path: string): Promise<void> {
  const bytes = await readFile(path);
  if (!isPdfBytes(bytes)) throw new Error('Arquivo baixado não possui assinatura PDF.');
}

export function isPdfBytes(bytes: Uint8Array): boolean {
  return bytes.length >= 5
    && bytes[0] === 0x25
    && bytes[1] === 0x50
    && bytes[2] === 0x44
    && bytes[3] === 0x46
    && bytes[4] === 0x2d;
}

export function normalizeIdentifier(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function firstSafeSentence(value: string): string | undefined {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean ? clean.slice(0, 500) : undefined;
}

export function safeError(error: unknown): string {
  return error instanceof Error
    ? `${error.name}: ${error.message}`.slice(0, 500)
    : String(error).slice(0, 500);
}

export function requiredString(value: unknown, code: string): string {
  const text = value == null ? '' : String(value).trim();
  if (!text) throw new Error(code);
  return text;
}

export function boundedInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

export function portalChanged(code: string, message: string) {
  return {
    status: 'FALHA' as const,
    erroCodigo: code,
    erroResumo: message,
    retryable: false,
  };
}

export function unavailable(code: string, error: unknown) {
  return {
    status: 'FONTE_INDISPONIVEL' as const,
    erroCodigo: code,
    erroResumo: safeError(error),
    retryable: true,
  };
}

export function unavailableText(text: string): boolean {
  return [
    'SERVICO INDISPONIVEL',
    'SISTEMA INDISPONIVEL',
    'TEMPORARIAMENTE INDISPONIVEL',
    'TENTE NOVAMENTE MAIS TARDE',
    'ERRO AO PROCESSAR A SOLICITACAO',
    'NAO FOI POSSIVEL ACESSAR O SERVICO',
    'MANUTENCAO',
    'ACESSO NEGADO',
  ].some((marker) => text.includes(marker));
}

export function captchaErrorText(text: string): boolean {
  return [
    'CAPTCHA INVALIDO',
    'VALIDACAO DE SEGURANCA',
    'CONFIRME QUE VOCE NAO E UM ROBO',
    'DESAFIO EXPIRADO',
    'RECAPTCHA INVALIDO',
  ].some((marker) => text.includes(marker));
}

async function tempPdfPath(executionId: string, downloadDirectory: string): Promise<string> {
  const directory = join(downloadDirectory, executionId);
  await mkdir(directory, { recursive: true });
  return join(directory, `${Date.now()}-${randomUUID()}.pdf`);
}

function isPdfResponse(response: Response): boolean {
  const contentType = response.headers()['content-type']?.toLowerCase() ?? '';
  return contentType.includes('application/pdf')
    || /\.pdf(?:$|[?#])/i.test(response.url());
}

function cssEscape(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}
