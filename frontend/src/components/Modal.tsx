import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';

export function Modal({
  aberto,
  titulo,
  aoFechar,
  children,
  rodape,
  className = '',
}: {
  aberto: boolean;
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
  rodape?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  const tituloId = useId();
  const modalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!aberto) return;
    const focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const elementosFocaveis = () => Array.from(
      modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((elemento) => !elemento.hasAttribute('hidden'));

    elementosFocaveis()[0]?.focus();
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') aoFechar();
      if (event.key !== 'Tab') return;

      const focaveis = elementosFocaveis();
      if (focaveis.length === 0) {
        event.preventDefault();
        modalRef.current?.focus();
        return;
      }
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
      focoAnterior?.focus();
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return createPortal(
    <div className="modal-backdrop" role="presentation" onMouseDown={aoFechar}>
      <section
        ref={modalRef}
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id={tituloId}>{titulo}</h2>
          <button
            className="icon-button"
            type="button"
            onClick={aoFechar}
            aria-label={t('acoes.fechar')}
          >
            ×
          </button>
        </header>
        <div className="modal__content">{children}</div>
        {rodape ? <footer className="modal__footer">{rodape}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}
