import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsoleTecnicaPage } from './ConsoleTecnicaPage';

const api = vi.fn();
vi.mock('../api/http', () => ({ api: (...args: unknown[]) => api(...args) }));

const resumo = {
  observadoEm: '2026-08-17T12:00:00Z',
  banco: { componente: 'postgresql', status: 'SAUDAVEL' },
  storage: { componente: 'documentos', status: 'SAUDAVEL' },
  worker: { componente: 'automation-worker', status: 'INDISPONIVEL', detalheSeguro: 'SEM_HEARTBEAT_REGISTRADO' },
  workers: [],
  workersRegistrados: 0,
  workersListaLimitada: false,
  workerDegradadoAposSegundos: 90,
  workerIndisponivelAposSegundos: 300,
  execucoesAbertas: 0,
  execucoesComFalha: 0,
  intervencoesPendentes: 0,
};

const reconciliacao = {
  observadoEm: '2026-08-17T12:01:00Z',
  status: 'DEGRADADO',
  motivoSeguro: 'DIVERGENCIA_STORAGE_DETECTADA',
  documentosRegistrados: 1,
  documentosAtivos: 1,
  referenciasAnalisadas: 1,
  referenciasCompletas: true,
  arquivosAnalisados: 2,
  arquivosCompletos: true,
  referenciasSemArquivoDetectadas: 0,
  referenciasSemArquivoCompleta: true,
  arquivosSemRegistroDetectados: 1,
  arquivosSemRegistroCompleta: true,
  linksSimbolicosIgnorados: 0,
  amostrasReferenciasSemArquivo: [],
  amostrasArquivosSemRegistro: ['fingerprint-seguro'],
};

describe('console tecnica atual', () => {
  beforeEach(() => api.mockReset());

  it('mantem loading ate o resumo chegar e permite retry apos falha', async () => {
    let resolver: ((value: typeof resumo) => void) | undefined;
    api.mockImplementationOnce(() => new Promise((resolve) => { resolver = resolve; }));
    const user = userEvent.setup();
    render(<ConsoleTecnicaPage />);

    expect(screen.queryByText('Heartbeats dos workers')).not.toBeInTheDocument();
    resolver?.(resumo);
    expect(await screen.findByText('Heartbeats dos workers')).toBeInTheDocument();

    api.mockRejectedValueOnce(new Error('stack interno que nao deve aparecer'));
    await user.click(screen.getByRole('button', { name: 'Atualizar' }));
    expect(await screen.findByText('Não foi possível carregar os dados.')).toBeInTheDocument();
    expect(screen.queryByText(/stack interno/)).not.toBeInTheDocument();

    api.mockResolvedValueOnce(resumo);
    await user.click(screen.getByRole('button', { name: 'Atualizar' }));
    await waitFor(() => expect(screen.queryByText('Não foi possível carregar os dados.')).not.toBeInTheDocument());
  });

  it('exibe erro seguro com correlation id e recupera exibindo divergencia', async () => {
    api.mockResolvedValueOnce(resumo).mockRejectedValueOnce({
      status: 500,
      mensagem: 'Falha técnica segura',
      correlationId: 'corr-console-001',
      stack: 'segredo interno',
    });
    const user = userEvent.setup();
    render(<ConsoleTecnicaPage />);
    await screen.findByText('Heartbeats dos workers');

    await user.click(screen.getByRole('button', { name: 'Verificar órfãos' }));
    expect(await screen.findByText('Falha técnica segura')).toBeInTheDocument();
    expect(screen.getByText('Código de rastreio: corr-console-001')).toBeInTheDocument();
    expect(screen.queryByText(/segredo interno/)).not.toBeInTheDocument();

    api.mockResolvedValueOnce(reconciliacao);
    await user.click(screen.getByRole('button', { name: 'Verificar órfãos' }));
    expect(await screen.findByText('Foram encontradas divergências. Nenhum arquivo foi excluído ou alterado.')).toBeInTheDocument();
    expect(screen.getByText('fingerprint-seguro')).toBeInTheDocument();
  });
});
