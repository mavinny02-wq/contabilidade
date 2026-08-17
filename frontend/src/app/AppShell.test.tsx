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
  it('oferece landmarks nomeados e atalho para teclado', () => {
    render(<MemoryRouter><AppShell /></MemoryRouter>);
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo principal' })).toHaveAttribute('href', '#conteudo-principal');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo-principal');
  });

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
