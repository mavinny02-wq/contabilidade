import { useTranslation } from 'react-i18next';
import { Button } from './Button';

export function Pagination({
  pagina,
  totalPaginas,
  aoMudar,
}: {
  pagina: number;
  totalPaginas: number;
  aoMudar: (pagina: number) => void;
}) {
  const { t } = useTranslation();
  if (totalPaginas <= 1) return null;

  return (
    <nav className="pagination" aria-label={t('comum.pagina', { atual: pagina + 1, total: totalPaginas })}>
      <Button
        variante="secundario"
        disabled={pagina <= 0}
        onClick={() => aoMudar(pagina - 1)}
      >
        {t('acoes.anterior')}
      </Button>
      <span>{t('comum.pagina', { atual: pagina + 1, total: totalPaginas })}</span>
      <Button
        variante="secundario"
        disabled={pagina >= totalPaginas - 1}
        onClick={() => aoMudar(pagina + 1)}
      >
        {t('acoes.proxima')}
      </Button>
    </nav>
  );
}
