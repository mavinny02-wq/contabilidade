import type { CapacidadeFluxo, FluxoPortal } from './contracts.js';

const chave = (provedorCodigo: string, operacao: string) => `${provedorCodigo}::${operacao}`;

export class FluxoRegistry {
  private readonly fluxos = new Map<string, FluxoPortal>();

  registrar(fluxo: FluxoPortal): void {
    const id = chave(fluxo.provedorCodigo, fluxo.operacao);
    if (this.fluxos.has(id)) {
      throw new Error(`Fluxo já registrado: ${id}`);
    }
    this.fluxos.set(id, fluxo);
  }

  obter(provedorCodigo: string, operacao: string): FluxoPortal | undefined {
    return this.fluxos.get(chave(provedorCodigo, operacao));
  }

  capacidades(): CapacidadeFluxo[] {
    return [...this.fluxos.values()]
      .map((fluxo) => ({
        provedorCodigo: fluxo.provedorCodigo,
        operacao: fluxo.operacao,
      }))
      .sort((a, b) => chave(a.provedorCodigo, a.operacao).localeCompare(chave(b.provedorCodigo, b.operacao)));
  }

  operacoes(): string[] {
    return [...new Set(this.capacidades().map((item) => item.operacao))].sort();
  }

  provedores(): string[] {
    return [...new Set(this.capacidades().map((item) => item.provedorCodigo))].sort();
  }

  codigos(): string[] {
    return this.capacidades().map((item) => chave(item.provedorCodigo, item.operacao));
  }
}
