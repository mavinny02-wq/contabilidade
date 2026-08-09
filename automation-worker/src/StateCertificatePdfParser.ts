import { readFile } from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { normalize, normalizeIdentifier } from './StateCertificateSupport.js';

export type ParsedStateCertificate = {
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

export async function parseSefazSpCertificate(
  filePath: string,
): Promise<ParsedStateCertificate> {
  const text = await extractPdfText(filePath);
  const normalized = normalize(text);
  if (!isSefazSpDocument(normalized)) {
    throw new Error('PDF_SEFAZ_SP_NAO_RECONHECIDO');
  }

  const result = classify(normalized);
  const issuedAt = findDate(text, [
    /data\s+(?:e\s+hora\s+)?da\s+emiss[aã]o\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i,
    /emitida\s+em\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i,
    /certid[aã]o\s+emitida\s+em\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i,
  ]);
  const validUntil = findDate(text, [
    /v[aá]lida\s+at[eé]\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i,
    /validade\s*(?:at[eé])?\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i,
  ]) ?? validityFromExplicitDuration(text, issuedAt);
  const number = firstGroup(text, [
    /n[uú]mero\s+da\s+certid[aã]o\s*:?\s*([A-Z0-9.\-\/]+)/i,
    /certid[aã]o\s+n[ºo°.]?\s*:?\s*([A-Z0-9.\-\/]+)/i,
    /c[oó]digo\s+de\s+controle\s*:?\s*([A-Z0-9.\-\/]+)/i,
  ]);
  const cnpj = normalizeCnpj(firstGroup(text, [
    /CNPJ\s*:?\s*([A-Z0-9.\/\-]{14,24})/i,
    /inscri[cç][aã]o\s+CNPJ\s*:?\s*([A-Z0-9.\/\-]{14,24})/i,
  ]));

  const complete = result !== 'INCOMPLETA'
    && (result === 'IRREGULAR' || Boolean(issuedAt && validUntil));
  return {
    result: complete ? result : 'INCOMPLETA',
    number,
    cnpj,
    issuedAt,
    validUntil,
    sourceMessage: complete
      ? 'Certidão de débitos tributários não inscritos obtida no sistema eCND da SEFAZ-SP.'
      : 'O PDF da SEFAZ-SP foi obtido, mas os dados necessários não puderam ser confirmados integralmente.',
    extractedText: text.slice(0, 12_000),
  };
}

export async function parsePgeSpCertificate(
  filePath: string,
): Promise<ParsedStateCertificate> {
  const text = await extractPdfText(filePath);
  const normalized = normalize(text);
  if (!isPgeSpDocument(normalized)) {
    throw new Error('PDF_PGE_SP_NAO_RECONHECIDO');
  }

  const result = classify(normalized);
  const issuedAt = findDate(text, [
    /data\s+(?:e\s+hora\s+)?da\s+emiss[aã]o\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i,
    /emitida\s+em\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i,
    /emiss[aã]o\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i,
  ]);
  const validUntil = findDate(text, [
    /v[aá]lida\s+at[eé]\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i,
    /validade\s*(?:at[eé])?\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i,
  ]) ?? validityFromExplicitDuration(text, issuedAt);
  const number = firstGroup(text, [
    /n[uú]mero\s+da\s+certid[aã]o\s*:?\s*([A-Z0-9.\-\/]+)/i,
    /certid[aã]o\s+n[ºo°.]?\s*:?\s*([A-Z0-9.\-\/]+)/i,
    /c[oó]digo\s+(?:de\s+)?(?:controle|autenticidade)\s*:?\s*([A-Z0-9.\-\/]+)/i,
  ]);
  const cnpj = normalizeCnpjBase(firstGroup(text, [
    /CNPJ(?:\s+BASE)?\s*:?\s*([A-Z0-9.\/\-]{8,24})/i,
    /contribuinte\s*:?\s*([A-Z0-9.\/\-]{8,24})/i,
  ]));

  const complete = result !== 'INCOMPLETA'
    && (result === 'IRREGULAR' || Boolean(issuedAt && validUntil));
  return {
    result: complete ? result : 'INCOMPLETA',
    number,
    cnpj,
    issuedAt,
    validUntil,
    sourceMessage: complete
      ? 'Certidão de regularidade da dívida ativa obtida no portal da PGE-SP.'
      : 'O PDF da PGE-SP foi obtido, mas os dados necessários não puderam ser confirmados integralmente.',
    extractedText: text.slice(0, 12_000),
  };
}

async function extractPdfText(filePath: string): Promise<string> {
  const bytes = new Uint8Array(await readFile(filePath));
  const document = await getDocument({ data: bytes, useSystemFonts: true }).promise;
  const pages: string[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' '));
      page.cleanup();
    }
  } finally {
    await document.destroy();
  }
  return pages.join('\n').replace(/\s+/g, ' ').trim();
}

function isSefazSpDocument(text: string): boolean {
  return (
    text.includes('DEBITOS TRIBUTARIOS NAO INSCRITOS')
    && (text.includes('SECRETARIA DA FAZENDA') || text.includes('FAZENDA E PLANEJAMENTO'))
  ) || text.includes('CERTIDAO NEGATIVA DE DEBITOS TRIBUTARIOS NAO INSCRITOS');
}

function isPgeSpDocument(text: string): boolean {
  return (
    text.includes('PROCURADORIA GERAL DO ESTADO')
    && (text.includes('DIVIDA ATIVA') || text.includes('REGULARIDADE FISCAL'))
  ) || text.includes('E-CRDA');
}

function classify(normalized: string): ParsedStateCertificate['result'] {
  if (
    normalized.includes('CERTIDAO POSITIVA COM EFEITOS DE NEGATIVA')
    || normalized.includes('CERTIDAO POSITIVA COM EFEITO DE NEGATIVA')
  ) {
    return 'POSITIVA_COM_EFEITO_NEGATIVA';
  }
  if (
    normalized.includes('CERTIDAO NEGATIVA')
    || normalized.includes('NAO CONSTAM DEBITOS')
    || normalized.includes('INEXISTENCIA DE DEBITOS')
  ) {
    return 'REGULAR';
  }
  if (
    normalized.includes('CERTIDAO POSITIVA')
    || normalized.includes('CONSTAM DEBITOS')
    || normalized.includes('EXISTENCIA DE DEBITOS')
  ) {
    return 'IRREGULAR';
  }
  return 'INCOMPLETA';
}

function findDate(text: string, patterns: RegExp[]): string | undefined {
  const raw = firstGroup(text, patterns);
  return raw ? parseBrazilianDate(raw) : undefined;
}

function parseBrazilianDate(raw: string): string | undefined {
  const [day, month, year] = raw.replace(/-/g, '/').split('/');
  if (!day || !month || !year) return undefined;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day)
  ) return undefined;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function validityFromExplicitDuration(
  text: string,
  issuedAt: string | undefined,
): string | undefined {
  if (!issuedAt) return undefined;
  const normalized = normalize(text);
  const months = /VALID(?:A|ADE).*?([0-9]{1,2})\s*\(?[A-Z]*\)?\s*MESES?/.exec(normalized)?.[1];
  if (months) return addMonths(issuedAt, Number(months));
  const days = /VALID(?:A|ADE).*?([0-9]{1,3})\s*\(?[A-Z]*\)?\s*DIAS?/.exec(normalized)?.[1];
  if (days) return addDays(issuedAt, Number(days));
  return undefined;
}

function addMonths(isoDate: string, amount: number): string | undefined {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 120) return undefined;
  const date = new Date(`${isoDate}T00:00:00Z`);
  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + amount);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDay));
  return date.toISOString().slice(0, 10);
}

function addDays(isoDate: string, amount: number): string | undefined {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 3660) return undefined;
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
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
  const normalized = normalizeIdentifier(value);
  return normalized.length >= 14 ? normalized.slice(0, 14) : undefined;
}

function normalizeCnpjBase(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = normalizeIdentifier(value);
  return normalized.length >= 8 ? normalized.slice(0, 8) : undefined;
}
