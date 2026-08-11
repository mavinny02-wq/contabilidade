import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AuthContextValue } from './types';
import { PermissionRoute } from './PermissionRoute';
import { ProtectedRoute } from './ProtectedRoute';

const useAuth = vi.fn<() => AuthContextValue>();
vi.mock('./AuthProvider', () => ({ useAuth: () => useAuth() }));

const auth = (overrides: Partial<AuthContextValue> = {}): AuthContextValue => ({
  inicializado: true, autenticado: true, temPermissao: () => true, sair: vi.fn(), ...overrides,
});

describe('guardas de rota', () => {
  it('redireciona usuario nao autenticado', () => {
    useAuth.mockReturnValue(auth({ autenticado: false }));
    render(<MemoryRouter initialEntries={['/privado']}><Routes>
      <Route element={<ProtectedRoute />}><Route path="/privado" element={<p>privado</p>} /></Route>
      <Route path="/erro-autenticacao" element={<p>erro de autenticacao</p>} />
    </Routes></MemoryRouter>);
    expect(screen.getByText('erro de autenticacao')).toBeInTheDocument();
  });

  it('mantem a rota quando autenticado e autorizado', () => {
    useAuth.mockReturnValue(auth());
    render(<MemoryRouter initialEntries={['/privado']}><Routes>
      <Route element={<ProtectedRoute />}><Route element={<PermissionRoute permissao="LER" />}>
        <Route path="/privado" element={<p>conteudo autorizado</p>} />
      </Route></Route>
    </Routes></MemoryRouter>);
    expect(screen.getByText('conteudo autorizado')).toBeInTheDocument();
  });

  it('redireciona usuario sem permissao', () => {
    useAuth.mockReturnValue(auth({ temPermissao: () => false }));
    render(<MemoryRouter initialEntries={['/privado']}><Routes>
      <Route element={<PermissionRoute permissao="LER" />}><Route path="/privado" element={<p>privado</p>} /></Route>
      <Route path="/sem-permissao" element={<p>sem permissao</p>} />
    </Routes></MemoryRouter>);
    expect(screen.getByText('sem permissao')).toBeInTheDocument();
  });
});
