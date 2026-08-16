import assert from 'node:assert/strict';
import test from 'node:test';
import { BackendError } from './BackendClient.js';
import { FluxoRegistry } from './FluxoRegistry.js';
import { concluirDentro, type TimeoutScheduler } from './Shutdown.js';
import { WorkerLoop, type WorkerLoopScheduler } from './WorkerLoop.js';
import type { ExecucaoLease, ResultadoFluxo } from './contracts.js';

class ManualScheduler implements WorkerLoopScheduler, TimeoutScheduler {
  private next = 0;
  readonly tasks = new Map<number, () => void>();

  setTimeout = (callback: () => void): number => this.add(callback);
  clearTimeout = (handle: unknown): void => { this.tasks.delete(handle as number); };
  setInterval = (callback: () => void): number => this.add(callback);
  clearInterval = (handle: unknown): void => { this.tasks.delete(handle as number); };

  runAll(): void {
    for (const callback of [...this.tasks.values()]) callback();
  }

  private add(callback: () => void): number {
    const handle = this.next++;
    this.tasks.set(handle, callback);
    return handle;
  }
}

const lease: ExecucaoLease = {
  id: 'execucao-ficticia',
  provedorCodigo: 'PROVEDOR_FICTICIO',
  operacao: 'CONSULTAR',
  leaseToken: 'lease-ficticio',
  leaseAte: '2099-01-01T00:00:00.000Z',
  tentativa: 1,
  maxTentativas: 3,
};

function registryWith(executar: () => Promise<ResultadoFluxo>): FluxoRegistry {
  const registry = new FluxoRegistry();
  registry.registrar({
    modo: 'API',
    provedorCodigo: lease.provedorCodigo,
    operacao: lease.operacao,
    executar,
  });
  return registry;
}

test('uma aquisição permanece exclusiva e lease só é renovado durante trabalho ativo', async () => {
  const scheduler = new ManualScheduler();
  let acquisitions = 0;
  let renewals = 0;
  let reports = 0;
  let finishFlow!: (result: ResultadoFluxo) => void;
  const flow = new Promise<ResultadoFluxo>((resolve) => { finishFlow = resolve; });
  const client = {
    adquirir: async () => { acquisitions++; return lease; },
    renovar: async () => { renewals++; },
    reportar: async () => { reports++; loop.parar(); },
  };
  const loop = new WorkerLoop({} as never, registryWith(async () => await flow), {} as never, client as never, scheduler);

  const running = loop.iniciar();
  await Promise.resolve();
  assert.equal(acquisitions, 1);
  assert.equal(scheduler.tasks.size, 1);
  scheduler.runAll();
  await Promise.resolve();
  assert.equal(renewals, 1);
  assert.equal(acquisitions, 1, 'não adquire outra execução enquanto a atual está ativa');

  finishFlow({ status: 'SUCESSO' });
  await running;
  assert.equal(reports, 1);
  assert.equal(scheduler.tasks.size, 0, 'timer do lease é removido após a execução');
  scheduler.runAll();
  assert.equal(renewals, 1, 'lease encerrado não volta a ser renovado');
});

test('lease expirado impede conclusão tardia sem fabricar sucesso', async () => {
  const scheduler = new ManualScheduler();
  let reports = 0;
  let finishFlow!: (result: ResultadoFluxo) => void;
  const flow = new Promise<ResultadoFluxo>((resolve) => { finishFlow = resolve; });
  const client = {
    adquirir: async () => lease,
    renovar: async () => { throw new BackendError(410, 'lease expirado fictício'); },
    reportar: async () => { reports++; },
  };
  const loop = new WorkerLoop({} as never, registryWith(async () => await flow), {} as never, client as never, scheduler);
  const running = loop.iniciar();
  await Promise.resolve();
  scheduler.runAll();
  await Promise.resolve();
  finishFlow({ status: 'SUCESSO' });
  await Promise.resolve();
  loop.parar();
  await running;
  assert.equal(reports, 0);
});

test('falhas retryable e terminais são reportadas uma única vez sem reclassificação', async () => {
  for (const retryable of [true, false]) {
    const expected: ResultadoFluxo = { status: 'FALHA', erroCodigo: 'FALHA_FICTICIA', retryable };
    const reported: ResultadoFluxo[] = [];
    const client = {
      adquirir: async () => lease,
      renovar: async () => undefined,
      reportar: async (_lease: ExecucaoLease, result: ResultadoFluxo) => { reported.push(result); loop.parar(); },
    };
    const loop = new WorkerLoop({} as never, registryWith(async () => expected), {} as never, client as never, new ManualScheduler());
    await loop.iniciar();
    assert.deepEqual(reported, [expected]);
  }
});

test('timeout de shutdown é bounded e sempre limpa seu timer', async () => {
  const scheduler = new ManualScheduler();
  const pending = new Promise<void>(() => undefined);
  const result = concluirDentro(pending, 50, scheduler);
  assert.equal(scheduler.tasks.size, 1);
  scheduler.runAll();
  assert.equal(await result, false);
  assert.equal(scheduler.tasks.size, 0);

  const completed = await concluirDentro(Promise.resolve(), 50, scheduler);
  assert.equal(completed, true);
  assert.equal(scheduler.tasks.size, 0);
});
