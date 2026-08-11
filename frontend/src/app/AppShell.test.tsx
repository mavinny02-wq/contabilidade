import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    usuario: { nome: 'Operador', autenticacaoAtiva: false },
    temPermissao: () => true,
    sair: vi.fn(),
  }),
}));
vi.mock('./GlobalSearch', () => ({ GlobalSearch: () => null }));

describe('navegacao principal', () => {
  it.each([
    ['/backups', 'Backups'],
    ['/atualizacoes', 'Atualizações'],
    ['/configuracao-segura', 'Configuração segura'],
    ['/console-tecnica/workers/historico', 'Histórico de workers'],
    ['/integracoes/faturas', 'Faturas de providers'],
  ])('expoe o link %s traduzido', (href, nome) => {
    render(<MemoryRouter><AppShell /></MemoryRouter>);
    expect(screen.getByRole('link', { name: nome })).toHaveAttribute('href', href);
  });
});
