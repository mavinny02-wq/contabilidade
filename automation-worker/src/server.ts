import http from 'node:http';
import type { BrowserRuntime } from './BrowserRuntime.js';
import type { FluxoRegistry } from './FluxoRegistry.js';
import { config } from './config.js';

const json = (response: http.ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
};

const lerJson = async (request: http.IncomingMessage): Promise<Record<string, unknown>> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
};

export function criarServidor(runtime: BrowserRuntime, registry: FluxoRegistry) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

      if (request.method === 'GET' && url.pathname === '/health') {
        const browser = await runtime.saudavel();
        json(response, browser ? 200 : 503, {
          status: browser ? 'SAUDAVEL' : 'INDISPONIVEL',
          workerId: config.workerId,
          fluxosRegistrados: registry.codigos(),
        });
        return;
      }

      if (request.method === 'GET' && url.pathname === '/flows') {
        json(response, 200, { fluxos: registry.codigos() });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/execute') {
        if (request.headers['x-worker-token'] !== config.token) {
          json(response, 401, { codigo: 'TOKEN_WORKER_INVALIDO' });
          return;
        }
        const body = await lerJson(request);
        const codigoFluxo = String(body.codigoFluxo ?? '');
        const fluxo = registry.obter(codigoFluxo);
        if (!fluxo) {
          json(response, 422, {
            codigo: 'FLUXO_NAO_REGISTRADO',
            mensagem: 'O worker está pronto, mas nenhum fluxo real de portal foi implementado.',
          });
          return;
        }

        const browserContext = await runtime.novoContexto();
        try {
          const page = await browserContext.newPage();
          const resultado = await fluxo.executar({
            execucaoId: String(body.execucaoId ?? ''),
            empresaId: body.empresaId ? String(body.empresaId) : undefined,
            parametros: (body.parametros as Record<string, unknown>) ?? {},
            browserContext,
            page,
          });
          json(response, 200, resultado);
        } finally {
          await browserContext.close();
        }
        return;
      }

      json(response, 404, { codigo: 'ROTA_NAO_ENCONTRADA' });
    } catch (error) {
      console.error('Falha no worker', error);
      json(response, 500, { codigo: 'ERRO_INTERNO_WORKER' });
    }
  });
}
