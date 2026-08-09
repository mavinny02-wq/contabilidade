import { useTranslation } from 'react-i18next';
import { EmptyState } from './EmptyState';

export function ModulePending() {
  const { t } = useTranslation();
  return (
    <EmptyState
      titulo={t('comum.emDesenvolvimento')}
      descricao={t('comum.emDesenvolvimentoDescricao')}
    />
  );
}
