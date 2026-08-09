import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/http';
import type { DashboardResumo } from '../api/types';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Alert } from '../components/Alert';

const valorInicial: DashboardResumo = {
  empresasAtivas: 0,
  documentosAtivos: 0,
  execucoesAbertas: 0,
  intervencoesPendentes: 0,
  notificacoesNaoLidas: 0,
};

export function DashboardPage() {
  const { t } = useTranslation();
  const [resumo, setResumo] = useState(valorInicial);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    void api<DashboardResumo>('/dashboard/resumo')
      .then(setResumo)
      .catch(() => setErro(true));
  }, []);

  const cards = [
    ['dashboard.empresasAtivas', resumo.empresasAtivas],
    ['dashboard.documentosAtivos', resumo.documentosAtivos],
    ['dashboard.execucoesAbertas', resumo.execucoesAbertas],
    ['dashboard.intervencoesPendentes', resumo.intervencoesPendentes],
    ['dashboard.notificacoesNaoLidas', resumo.notificacoesNaoLidas],
  ] as const;

  return (
    <>
      <PageHeader titulo={t('dashboard.titulo')} descricao={t('dashboard.descricao')} />
      {erro ? <Alert tipo="erro">{t('comum.erroCarregamento')}</Alert> : null}
      <div className="metric-grid">
        {cards.map(([key, value]) => (
          <Card key={key} className="metric-card">
            <span>{t(key)}</span>
            <strong>{value}</strong>
          </Card>
        ))}
      </div>
      <Card titulo={t('dashboard.proximosPassos')}>
        <p className="muted">{t('dashboard.proximosPassosDescricao')}</p>
      </Card>
    </>
  );
}
