import { runtimeConfig } from '../config/runtime';

export type ApiError = {
  timestamp?: string;
  status?: number;
  codigo?: string;
  mensagemKey?: string;
  mensagem?: string;
  caminho?: string;
  correlationId?: string;
  campos?: Array<{ campo: string; mensagem: string }>;
};

let tokenProvider: () => string | undefined = () => undefined;

export const definirTokenProvider = (provider: () => string | undefined) => {
  tokenProvider = provider;
};

const correlationId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = tokenProvider();
  headers.set('X-Correlation-Id', correlationId());
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const isFormData = init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${runtimeConfig.apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let error: ApiError = {
      status: response.status,
      mensagem: response.statusText,
      correlationId: response.headers.get('X-Correlation-Id') ?? undefined,
    };
    try {
      error = await response.json();
    } catch {
      // Mantém o erro HTTP seguro.
    }
    throw error;
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return (await response.blob()) as unknown as T;
  return (await response.json()) as T;
}

export async function baixarArquivo(path: string): Promise<{ blob: Blob; nome?: string }> {
  const headers = new Headers();
  const token = tokenProvider();
  headers.set('X-Correlation-Id', correlationId());
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${runtimeConfig.apiBaseUrl}${path}`, { headers });
  if (!response.ok) {
    let error: ApiError = { status: response.status, mensagem: response.statusText };
    try {
      error = await response.json();
    } catch {
      // Mantém o erro HTTP seguro.
    }
    throw error;
  }
  const disposition = response.headers.get('content-disposition');
  const utfName = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const simpleName = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: await response.blob(),
    nome: utfName ? decodeURIComponent(utfName) : simpleName,
  };
}
