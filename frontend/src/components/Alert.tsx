import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export function Alert({
  tipo,
  children,
  onClose,
}: {
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info';
  children: ReactNode;
  onClose?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className={`alert alert--${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      <div>{children}</div>
      {onClose ? (
        <button
          type="button"
          className="alert__close"
          onClick={onClose}
          aria-label={t('acoes.fechar')}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
