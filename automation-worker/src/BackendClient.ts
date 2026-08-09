import { basename } from 'node:path';
import { readFile } from 'node:fs/promises';
import { config } from './config.js';
import type {
  DocumentoWorkerInput,
  ExecucaoLease,
  IntervencaoRequest,
  ResultadoFluxo,
} from './contracts.js';

type HttpOptions = {
  method?: string;
  body?: unknown;
  timeoutMs?: number;
};

export class BackendClient {
  async heartbeat(status: string): Promise<void> {
    await this.request('/api/interno/workers/heartbeat', {
      method: 'POST',
      body: {
        workerId: config.workerId,
        versao: '0.4.0',
        status,
        observadoEm: new Date().toISOString(),
      },
    });
  }

  async adquirir(operacoes: string[], provedores: string[]): Promise<ExecucaoLease | undefined> {
    if (operacoes.length === 0 || provedores.length === 0) return undefined;
    const response = await this.raw('/api/interno/workers/execucoes/adquirir', {
      method: 'POST',
      body: {
        workerId: config.workerId,
        operacoes,
        provedores,
        leaseSegundos: config.leaseSeconds,
      },
    });
    if (response.status === 204) return undefined;
    if (!response.ok) throw await this.error(response);
    return await response.json() as ExecucaoLease;
  }

  async renovar(execucaoId: string, leaseToken: string): Promise<void> {
    await this.request(`/api/interno/workers/execucoes/${execucaoId}/renovar`, {
      method: 'PATCH',
      body: { leaseToken, leaseSegundos: config.leaseSeconds },
    });
  }

  async aguardarHumano(
    execucao: ExecucaoLease,
    sessionId: string,
    request: IntervencaoRequest,
  ): Promise<void> {
    await this.request(`/api/interno/workers/execucoes/${execucao.id}/aguardar-humano`, {
      method: 'POST',
      body: {
        leaseToken: execucao.leaseToken,
        status: request.tipo === 'CAPTCHA'
          ? 'AGUARDANDO_CAPTCHA'
          : request.tipo === 'AUTENTICACAO' || request.tipo === 'MFA'
            ? 'AGUARDANDO_AUTENTICACAO'
            : 'AGUARDANDO_HUMANO',
        tipo: request.tipo,
        codigo: request.codigo,
        resumo: request.resumo ?? null,
        tituloKey: request.tituloKey,
        instrucaoKey: request.instrucaoKey,
        sessaoReferencia: sessionId,
        timeoutMinutos: request.timeoutMinutos ?? 30,
      },
    });
  }

  async retomarSessao(input: {
    execucaoId: string;
    sessionId: string;
    operador: string;
    observacao?: string;
  }): Promise<ExecucaoLease> {
    return await this.request<ExecucaoLease>(
      `/api/interno/workers/execucoes/${input.execucaoId}/retomar-sessao`,
      {
        method: 'POST',
        body: {
          workerId: config.workerId,
          sessionId: input.sessionId,
          operador: input.operador,
          observacao: input.observacao ?? 'Etapa interativa concluída pelo operador.',
          leaseSegundos: config.leaseSeconds,
        },
      },
    );
  }

  async enviarDocumento(input: DocumentoWorkerInput): Promise<{ id: string }> {
    const conteudo = await readFile(input.arquivoPath);
    const form = new FormData();
    form.append('empresaId', input.empresaId);
    form.append('tipo', input.tipo);
    form.append('origem', input.origem);
    form.append(
      'arquivo',
      new Blob([new Uint8Array(conteudo)], { type: input.mimeType }),
      input.nomeArquivo ?? basename(input.arquivoPath),
    );
    if (input.emitidoEm) form.append('emitidoEm', input.emitidoEm);
    if (input.validoAte) form.append('validoAte', input.validoAte);

    const response = await fetch(`${config.backendUrl}/api/interno/workers/documentos`, {
      method: 'POST',
      headers: { 'X-Worker-Token': config.token },
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw await this.error(response);
    return await response.json() as { id: string };
  }

  async reportar(execucao: ExecucaoLease, resultado: ResultadoFluxo): Promise<void> {
    if (resultado.status === 'SUCESSO') {
      await this.request(`/api/interno/workers/execucoes/${execucao.id}/concluir`, {
        method: 'POST',
        body: {
          leaseToken: execucao.leaseToken,
          protocoloExterno: resultado.protocoloExterno ?? null,
          resultado: resultado.dados ?? {},
          custo: resultado.custo ?? null,
          moeda: resultado.moeda ?? null,
        },
      });
      return;
    }

    if (resultado.status === 'AGUARDANDO_HUMANO') {
      await this.request(`/api/interno/workers/execucoes/${execucao.id}/aguardar-humano`, {
        method: 'POST',
        body: {
          leaseToken: execucao.leaseToken,
          status: resultado.tipoIntervencao === 'CAPTCHA'
            ? 'AGUARDANDO_CAPTCHA'
            : resultado.tipoIntervencao === 'AUTENTICACAO' || resultado.tipoIntervencao === 'MFA'
              ? 'AGUARDANDO_AUTENTICACAO'
              : 'AGUARDANDO_HUMANO',
          tipo: resultado.tipoIntervencao,
          codigo: resultado.codigo,
          resumo: resultado.resumo ?? null,
          tituloKey: resultado.tituloKey,
          instrucaoKey: resultado.instrucaoKey,
          sessaoReferencia: resultado.sessaoReferencia ?? null,
          timeoutMinutos: resultado.timeoutMinutos ?? 30,
        },
      });
      return;
    }

    await this.request(`/api/interno/workers/execucoes/${execucao.id}/falhar`, {
      method: 'POST',
      body: {
        leaseToken: execucao.leaseToken,
        codigo: resultado.erroCodigo,
        resumo: resultado.erroResumo ?? null,
        retryable: resultado.retryable,
        fonteIndisponivel: resultado.status === 'FONTE_INDISPONIVEL',
      },
    });
  }

  private async request<T = unknown>(path: string, options: HttpOptions): Promise<T> {
    const response = await this.raw(path, options);
    if (!response.ok) throw await this.error(response);
    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  }

  private async raw(path: string, options: HttpOptions): Promise<Response> {
    return fetch(`${config.backendUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Token': config.token,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
    });
  }

  private async error(response: Response): Promise<Error> {
    let body = '';
    try {
      body = await response.text();
    } catch {
      body = response.statusText;
    }
    return new BackendError(
      response.status,
      `Backend rejeitou a operação: HTTP ${response.status} ${body.slice(0, 500)}`,
    );
  }
}

export class BackendError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'BackendError';
  }
}
