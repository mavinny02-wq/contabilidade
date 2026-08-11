import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ResponsaveisModuloPage } from './ResponsaveisModuloPage';

const api = vi.fn();
vi.mock('../api/http', () => ({ api: (...args: unknown[]) => api(...args) }));
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ temPermissao: () => true }) }));

describe('validacao do responsavel por modulo', () => {
  it('nao envia email invalido ao backend', async () => {
    api.mockImplementation((path: string) => path.endsWith('/responsaveis-modulo') ? Promise.resolve([]) : Promise.resolve({
      id: 'empresa-1', razaoSocial: 'Empresa de teste', ativa: true, estabelecimentos: [],
      criadoEm: '2026-08-11T00:00:00Z', atualizadoEm: '2026-08-11T00:00:00Z',
    }));
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/empresas/empresa-1/responsaveis-modulo']}><Routes>
      <Route path="/empresas/:id/responsaveis-modulo" element={<ResponsaveisModuloPage />} />
    </Routes></MemoryRouter>);
    await screen.findByText('Empresa de teste');

    await user.type(screen.getAllByLabelText('Nome do responsável')[0], 'Responsável Fiscal');
    await user.type(screen.getAllByLabelText('E-mail')[0], 'email-invalido');
    await user.click(screen.getAllByRole('button', { name: 'Salvar' })[0]);

    await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
    expect(screen.getAllByLabelText('E-mail')[0]).toBeInvalid();
  });
});
