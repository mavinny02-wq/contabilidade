import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('mantem o foco no dialogo e o devolve ao elemento acionador', async () => {
    const user = userEvent.setup();
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const { unmount } = render(
      <Modal aberto titulo="Detalhes" aoFechar={vi.fn()} rodape={<button>Confirmar</button>}>
        <button>Primeira ação</button>
      </Modal>,
    );

    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus();

    unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
