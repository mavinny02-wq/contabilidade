import assert from 'node:assert/strict';
import test from 'node:test';
import { FluxoRegistry } from '../FluxoRegistry.js';
import type { FluxoIntegracao } from '../contracts.js';
import { registerWorkerFlows, type WorkerFlowFactory } from './WorkerFlowComposition.js';

const flow = (
  provedorCodigo: string,
  operacao: string,
  modo: FluxoIntegracao['modo'],
): FluxoIntegracao => ({
  provedorCodigo,
  operacao,
  modo,
  executar: async () => ({ status: 'SUCESSO' as const }),
});

test('compõe factories na ordem declarada e preserva as capacidades', () => {
  const calls: string[] = [];
  const factories: WorkerFlowFactory[] = [
    () => { calls.push('federal'); return flow('FEDERAL', 'EMITIR_CND', 'PORTAL'); },
    () => { calls.push('serpro'); return flow('SERPRO', 'CONSULTAR_CND', 'API'); },
  ];
  const registry = new FluxoRegistry();

  registerWorkerFlows(registry, factories);

  assert.deepEqual(calls, ['federal', 'serpro']);
  assert.deepEqual(registry.capacidades(), [
    { provedorCodigo: 'FEDERAL', operacao: 'EMITIR_CND', modo: 'PORTAL' },
    { provedorCodigo: 'SERPRO', operacao: 'CONSULTAR_CND', modo: 'API' },
  ]);
});

test('não registra provider ausente da composição recebida', () => {
  const registry = new FluxoRegistry();

  registerWorkerFlows(registry, [() => flow('FEDERAL', 'EMITIR_CND', 'PORTAL')]);

  assert.equal(registry.obter('SERPRO', 'CONSULTAR_CND'), undefined);
  assert.deepEqual(registry.codigos(), ['FEDERAL::EMITIR_CND']);
});

test('composição padrão preserva códigos, operações e modos dos quatro providers', () => {
  const registry = new FluxoRegistry();

  registerWorkerFlows(registry);

  assert.deepEqual(registry.capacidades(), [
    { provedorCodigo: 'FEDERAL_PORTAL', operacao: 'CERTIDAO_FEDERAL_RFB_PGFN', modo: 'PORTAL' },
    { provedorCodigo: 'PGE_SP_PORTAL', operacao: 'CERTIDAO_SP_PGE_DIVIDA_ATIVA', modo: 'PORTAL' },
    { provedorCodigo: 'SEFAZ_SP_PORTAL', operacao: 'CERTIDAO_SP_SEFAZ_NAO_INSCRITOS', modo: 'PORTAL' },
    { provedorCodigo: 'SERPRO', operacao: 'CERTIDAO_FEDERAL_RFB_PGFN', modo: 'API' },
  ]);
});
