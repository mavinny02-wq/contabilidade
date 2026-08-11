import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

type CanvasRuntime = {
  DOMMatrix?: unknown;
  ImageData?: unknown;
  Path2D?: unknown;
};

type PdfRuntimeGlobals = {
  DOMMatrix?: unknown;
  ImageData?: unknown;
  Path2D?: unknown;
};

class TextExtractionDomMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;

  constructor(init?: ArrayLike<number>) {
    if (init?.length === 6) {
      this.a = Number(init[0] ?? 1);
      this.b = Number(init[1] ?? 0);
      this.c = Number(init[2] ?? 0);
      this.d = Number(init[3] ?? 1);
      this.e = Number(init[4] ?? 0);
      this.f = Number(init[5] ?? 0);
      return;
    }

    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
  }

  translateSelf(tx: number, ty = 0): this {
    this.e = this.a * tx + this.c * ty + this.e;
    this.f = this.b * tx + this.d * ty + this.f;
    return this;
  }

  scaleSelf(sx: number, sy = sx): this {
    this.a *= sx;
    this.b *= sx;
    this.c *= sy;
    this.d *= sy;
    return this;
  }
}

class TextExtractionImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;

  constructor(
    dataOrWidth: Uint8ClampedArray | number,
    widthOrHeight: number,
    height?: number,
  ) {
    if (typeof dataOrWidth === 'number') {
      this.width = dataOrWidth;
      this.height = widthOrHeight;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
      return;
    }

    this.data = dataOrWidth;
    this.width = widthOrHeight;
    this.height = height ?? Math.floor(this.data.length / Math.max(this.width * 4, 1));
  }
}

class TextExtractionPath2D {
  constructor(_path?: unknown) {
    // A extração de texto não executa operações de desenho.
  }
}

const require = createRequire(import.meta.url);
let pdfJsModulePromise: Promise<PdfJsModule> | undefined;

function preparePdfJsRuntime(): void {
  const runtime = globalThis as unknown as PdfRuntimeGlobals;
  let canvas: CanvasRuntime | undefined;

  try {
    canvas = require('@napi-rs/canvas') as CanvasRuntime;
  } catch {
    // O worker pode ter sido empacotado sem o binding nativo opcional. Os
    // fallbacks abaixo cobrem somente a leitura de texto e evitam que o
    // carregamento do PDF.js derrube o processo inteiro.
  }

  runtime.DOMMatrix ??= canvas?.DOMMatrix ?? TextExtractionDomMatrix;
  runtime.ImageData ??= canvas?.ImageData ?? TextExtractionImageData;
  runtime.Path2D ??= canvas?.Path2D ?? TextExtractionPath2D;
}

async function loadPdfJs(): Promise<PdfJsModule> {
  preparePdfJsRuntime();
  pdfJsModulePromise ??= import('pdfjs-dist/legacy/build/pdf.mjs');
  return pdfJsModulePromise;
}

export async function extractTextFromPdf(filePath: string): Promise<string> {
  const data = new Uint8Array(await readFile(filePath));
  const { getDocument } = await loadPdfJs();
  const loadingTask = getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: true,
  });
  const document = await loadingTask.promise;
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
    await loadingTask.destroy();
  }

  return pages.join('\n').replace(/\s+/g, ' ').trim();
}
