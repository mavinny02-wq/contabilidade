import { useEffect, type ReactNode } from 'react';
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

  useEffect(() => {
    if (!aberto) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') aoFechar();
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return createPortal(
    <div className="modal-backdrop" role="presentation" onMouseDown={aoFechar}>
      <section
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="modal-title">{titulo}</h2>
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
