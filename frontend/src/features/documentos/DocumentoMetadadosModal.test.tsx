import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Documento } from '../../api/types';
import { DocumentoMetadadosModal } from './DocumentoMetadadosModal';

const api = vi.fn();
vi.mock('../../api/http', () => ({ api: (...args: unknown[]) => api(...args) }));

const documento: Documento = {
  id: 'doc-1', empresaId: 'empresa-1', tipo: 'OUTRO', nomeOriginal: 'arquivo.pdf',
  mimeType: 'application/pdf', tamanhoBytes: 10, hashSha256: 'hash-seguro', origem: 'UPLOAD',
  criadoEm: '2026-08-11T00:00:00Z',
};

describe('edicao de metadados do documento', () => {
  it('normaliza datas vazias e salva pelo wrapper HTTP', async () => {
    const user = userEvent.setup();
    const atualizado = { ...documento, tipo: 'GUIA' };
    api.mockResolvedValue(atualizado);
    const aoSalvar = vi.fn();
    render(<DocumentoMetadadosModal documento={documento} aoFechar={vi.fn()} aoSalvar={aoSalvar} />);

    await user.selectOptions(screen.getByLabelText('Classificação'), 'GUIA');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(api).toHaveBeenCalledWith('/documentos/doc-1/metadados', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ tipo: 'GUIA', emitidoEm: null, validoAte: null }),
    }));
    expect(aoSalvar).toHaveBeenCalledWith(atualizado);
  });
});
