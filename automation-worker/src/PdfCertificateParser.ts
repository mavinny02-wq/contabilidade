import { readFile } from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export type ParsedFederalCertificate = {
  result:
    | 'REGULAR'
    | 'POSITIVA_COM_EFEITO_NEGATIVA'
    | 'IRREGULAR'
    | 'INCOMPLETA';
  number?: string;
  cnpj?: string;
  issuedAt?: string;
  validUntil?: string;
  sourceMessage: string;
  extractedText: string;
};

export async function parseFederalCertificate(
  filePath: string,
): Promise<ParsedFederalCertificate> {
  const bytes = new Uint8Array(await readFile(filePath));
  const document = await getDocument({
    data: bytes,
    useSystemFonts: true,
  }).promise;

  const pages: string[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((item) => ('str' in item ? item.str : ''))
          .filter(Boolean)
          .join(' '),
      );
      page.cleanup();
    }
  } finally {
    await document.destroy();
  }

  const text = pages.join('\n').replace(/\s+/g, ' ').trim();
  const normalized = normalize(text);
  const result = classify(normalized);
  const issuedAt = findDate(text, [
    /emitida\s+(?:às?.*?\s+)?(?:do\s+dia|em)\s*(\d{2}\/\d{2}\/\d{4})/i,
    /data\s+de\s+emiss[aã]o\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
  ]);
  const validUntil = findDate(text, [
    /v[aá]lida\s+at[eé]\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
    /validade\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
  ]);
  const number = firstGroup(text, [
    /c[oó]digo\s+de\s+controle(?:\s+da\s+certid[aã]o)?\s*:?\s*([A-Z0-9.\-\/]+)/i,
    /n[uú]mero\s+da\s+certid[aã]o\s*:?\s*([A-Z0-9.\-\/]+)/i,
  ]);
  const cnpj = normalizeCnpj(firstGroup(text, [
    /CNPJ\s*:?\s*([A-Z0-9.\/\-]{14,22})/i,
    /inscri[cç][aã]o\s+CNPJ\s*:?\s*([A-Z0-9.\/\-]{14,22})/i,
  ]));

  const isComplete =
    result !== 'INCOMPLETA'
    && (result === 'IRREGULAR' || Boolean(issuedAt && validUntil));

  return {
    result: isComplete ? result : 'INCOMPLETA',
    number,
    cnpj,
    issuedAt,
    validUntil,
    sourceMessage: isComplete
      ? 'Certidão federal obtida e interpretada pelo portal da Receita Federal.'
      : 'O PDF foi obtido, mas os dados necessários não puderam ser confirmados integralmente.',
    extractedText: text.slice(0, 12_000),
  };
}

function classify(normalized: string): ParsedFederalCertificate['result'] {
  if (
    normalized.includes('CERTIDAO POSITIVA COM EFEITOS DE NEGATIVA')
    || normalized.includes('CERTIDAO POSITIVA COM EFEITO DE NEGATIVA')
  ) {
    return 'POSITIVA_COM_EFEITO_NEGATIVA';
  }
  if (normalized.includes('CERTIDAO NEGATIVA')) return 'REGULAR';
  if (normalized.includes('CERTIDAO POSITIVA')) return 'IRREGULAR';
  return 'INCOMPLETA';
}

function findDate(text: string, patterns: RegExp[]): string | undefined {
  const raw = firstGroup(text, patterns);
  if (!raw) return undefined;
  const [day, month, year] = raw.split('/');
  if (!day || !month || !year) return undefined;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day)
  ) {
    return undefined;
  }
  return `${year}-${month}-${day}`;
}

function firstGroup(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function normalizeCnpj(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return normalized.length >= 14 ? normalized : undefined;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/\s+/g, ' ');
}
