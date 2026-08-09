import type {
  CapacidadeFluxo,
  DiagnosticoFluxo,
  FluxoIntegracao,
} from './contracts.js';

const chave = (provedorCodigo: string, operacao: string) =>
  `${provedorCodigo}::${operacao}`;

export type DiagnosticoFluxoRegistrado = CapacidadeFluxo & DiagnosticoFluxo;

export class FluxoRegistry {
  private readonly fluxos = new Map<string, FluxoIntegracao>();

  registrar(fluxo: FluxoIntegracao): void {
    const id = chave(fluxo.provedorCodigo, fluxo.operacao);
    if (this.fluxos.has(id)) {
      throw new Error(`Fluxo já registrado: ${id}`);
    }
    this.fluxos.set(id, fluxo);
  }

  obter(provedorCodigo: string, operacao: string): FluxoIntegracao | undefined {
    return this.fluxos.get(chave(provedorCodigo, operacao));
  }

  capacidades(): CapacidadeFluxo[] {
    return [...this.fluxos.values()]
      .map((fluxo) => ({
        provedorCodigo: fluxo.provedorCodigo,
        operacao: fluxo.operacao,
        modo: fluxo.modo,
      }))
      .sort((a, b) =>
        chave(a.provedorCodigo, a.operacao).localeCompare(
          chave(b.provedorCodigo, b.operacao),
        ),
      );
  }

  diagnosticos(): DiagnosticoFluxoRegistrado[] {
    return [...this.fluxos.values()]
      .map((fluxo) => {
        let diagnostico: DiagnosticoFluxo = { configurado: true };
        try {
          diagnostico = fluxo.diagnostico?.() ?? diagnostico;
        } catch (error) {
          diagnostico = {
            configurado: false,
            detalheSeguro:
              error instanceof Error
                ? `${error.name}: ${error.message}`.slice(0, 200)
                : 'Falha ao obter diagnóstico.',
          };
        }
        return {
          provedorCodigo: fluxo.provedorCodigo,
          operacao: fluxo.operacao,
          modo: fluxo.modo,
          ...diagnostico,
        };
      })
      .sort((a, b) =>
        chave(a.provedorCodigo, a.operacao).localeCompare(
          chave(b.provedorCodigo, b.operacao),
        ),
      );
  }

  possuiPortal(): boolean {
    return [...this.fluxos.values()].some((fluxo) => fluxo.modo === 'PORTAL');
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
