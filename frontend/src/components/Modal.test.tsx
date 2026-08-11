import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('nao monta conteudo quando fechado', () => {
    render(<Modal aberto={false} titulo="Detalhes" aoFechar={vi.fn()}>conteudo</Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('fecha pelo botao e pela tecla Escape', () => {
    const aoFechar = vi.fn();
    render(<Modal aberto titulo="Detalhes" aoFechar={aoFechar}>conteudo</Modal>);
    expect(screen.getByRole('dialog', { name: 'Detalhes' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(aoFechar).toHaveBeenCalledTimes(2);
  });
});
