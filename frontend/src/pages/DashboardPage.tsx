import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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
  certidoesRegulares: 0,
  certidoesAtencao: 0,
  certidoesAcaoManual: 0,
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
    ['dashboard.empresasAtivas', resumo.empresasAtivas, '/empresas', 'neutro'],
    ['dashboard.certidoesRegulares', resumo.certidoesRegulares ?? 0, '/certidoes', 'sucesso'],
    ['dashboard.certidoesAtencao', resumo.certidoesAtencao ?? 0, '/certidoes', 'aviso'],
    ['dashboard.intervencoesPendentes', resumo.intervencoesPendentes, '/intervencoes', 'aviso'],
    ['dashboard.execucoesAbertas', resumo.execucoesAbertas, '/execucoes', 'info'],
    ['dashboard.documentosAtivos', resumo.documentosAtivos, '/documentos', 'neutro'],
    ['dashboard.notificacoesNaoLidas', resumo.notificacoesNaoLidas, '/notificacoes', 'info'],
  ] as const;

  return (
    <>
      <PageHeader titulo={t('dashboard.titulo')} descricao={t('dashboard.descricao')} />
      {erro ? <Alert tipo="erro">{t('comum.erroCarregamento')}</Alert> : null}
      <div className="metric-grid metric-grid--expanded">
        {cards.map(([key, value, destino, tom]) => (
          <Link to={destino} key={key} className={`card metric-card metric-card--${tom}`}>
            <span>{t(key)}</span>
            <strong>{value}</strong>
          </Link>
        ))}
      </div>
      <div className="detail-grid">
        <Card titulo={t('dashboard.certidoesTitulo')}>
          <div className="dashboard-feature">
            <p>{t('dashboard.certidoesDescricao')}</p>
            <div className="dashboard-feature__figures">
              <div><strong>{resumo.certidoesRegulares ?? 0}</strong><span>{t('dashboard.certidoesRegulares')}</span></div>
              <div><strong>{resumo.certidoesAcaoManual ?? 0}</strong><span>{t('dashboard.certidoesAcaoManual')}</span></div>
            </div>
            <Link className="button button--primario" to="/certidoes">{t('certidoes.acoes.abrirCentro')}</Link>
          </div>
        </Card>
        <Card titulo={t('dashboard.proximosPassos')}>
          <p className="muted">{t('dashboard.proximosPassosDescricaoV2')}</p>
        </Card>
      </div>
    </>
  );
}
