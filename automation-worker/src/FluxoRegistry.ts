import type { FluxoPortal } from './contracts.js';

export class FluxoRegistry {
  private readonly fluxos = new Map<string, FluxoPortal>();

  registrar(fluxo: FluxoPortal): void {
    if (this.fluxos.has(fluxo.codigo)) {
      throw new Error(`Fluxo já registrado: ${fluxo.codigo}`);
    }
    this.fluxos.set(fluxo.codigo, fluxo);
  }

  obter(codigo: string): FluxoPortal | undefined {
    return this.fluxos.get(codigo);
  }

  codigos(): string[] {
    return [...this.fluxos.keys()].sort();
  }
}
