import http from 'node:http';
import type { BrowserRuntime } from './BrowserRuntime.js';
import type { FluxoRegistry } from './FluxoRegistry.js';
import type { WorkerLoop } from './WorkerLoop.js';
import { config } from './config.js';

const json = (response: http.ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
};

export function criarServidor(runtime: BrowserRuntime, registry: FluxoRegistry, loop: WorkerLoop) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
      if (request.method === 'GET' && url.pathname === '/health') {
        const browser = await runtime.saudavel();
        json(response, browser ? 200 : 503, {
          status: browser ? 'SAUDAVEL' : 'INDISPONIVEL',
          workerId: config.workerId,
          versao: '0.2.0',
          fluxosRegistrados: registry.codigos(),
          loop: loop.state,
        });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/flows') {
        json(response, 200, { fluxos: registry.codigos() });
        return;
      }
      json(response, 404, { codigo: 'ROTA_NAO_ENCONTRADA' });
    } catch (error) {
      console.error('Falha no endpoint do worker', error);
      json(response, 500, { codigo: 'ERRO_INTERNO_WORKER' });
    }
  });
}
