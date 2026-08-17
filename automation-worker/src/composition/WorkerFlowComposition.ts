import { FederalCertificateFlow } from '../FederalCertificateFlow.js';
import { PgeSpCertificateFlow } from '../PgeSpCertificateFlow.js';
import { SefazSpCertificateFlow } from '../SefazSpCertificateFlow.js';
import { SerproCndFlow } from '../SerproCndFlow.js';
import type { FluxoRegistry } from '../FluxoRegistry.js';
import type { FluxoIntegracao } from '../contracts.js';

export type WorkerFlowFactory = () => FluxoIntegracao;

export const workerFlowFactories: readonly WorkerFlowFactory[] = [
  () => new FederalCertificateFlow(),
  () => new SefazSpCertificateFlow(),
  () => new PgeSpCertificateFlow(),
  () => new SerproCndFlow(),
];

export function registerWorkerFlows(
  registry: FluxoRegistry,
  factories: readonly WorkerFlowFactory[] = workerFlowFactories,
): void {
  for (const factory of factories) {
    registry.registrar(factory());
  }
}
