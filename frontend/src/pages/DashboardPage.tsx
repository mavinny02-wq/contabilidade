import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api } from '../api/http';
import type { DashboardResumo, StatusCertidao, TipoCertidao } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import '../styles/dashboard-certidoes.css';

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

type ResumoGerencialCertidoes = {
  observadoEm: string;
  totalRegistradas: number;
  totalAnalisadas: number;
  parcial: boolean;
  regulares: number;
  atencao: number;
  emAndamento: number;
  porStatus: Partial<Record<StatusCertidao, number>>;
  porTipo: Partial<Record<TipoCertidao, number>>;
  vencemEmTrintaDias: number;
  semValidade: number;
  ultimaAtualizacao?: string;
};

const tiposCertidao: TipoCertidao[] = [
  'FEDERAL_RFB_PGFN',
  'SP_SEFAZ_NAO_INSCRITOS',
  'SP_PGE_DIVIDA_ATIVA',
];

const statusCertidao: StatusCertidao[] = [
  'REGULAR',
  'POSITIVA_COM_EFEITO_NEGATIVA',
  'IRREGULAR',
  'INCOMPLETA',
  'PROXIMA_DO_VENCIMENTO',
  'VENCIDA',
  'ACAO_MANUAL_NECESSARIA',
  'FONTE_INDISPONIVEL',
  'AGENDADA',
  'EM_PROCESSAMENTO',
  'NAO_CONSULTADA',
  'FALHA',
];

export function DashboardPage() {
  const { t } = useTranslation();
  const { temPermissao } = useAuth();
  const podeLerCertidoes = temPermissao(PERMISSOES.CERTIDAO_LER);
  const [resumo, setResumo] = useState(valorInicial);
  const [gerencial, setGerencial] = useState<ResumoGerencialCertidoes>();
  const [erro, setErro] = useState(false);
  const [erroGerencial, setErroGerencial] = useState(false);

  useEffect(() => {
    void api<DashboardResumo>('/dashboard/resumo')
      .then(setResumo)
      .catch(() => setErro(true));
  }, []);

  useEffect(() => {
    if (!podeLerCertidoes) return;
    setErroGerencial(false);
    void api<ResumoGerencialCertidoes>('/certidoes/dashboard-gerencial')
      .then(setGerencial)
      .catch(() => setErroGerencial(true));
  }, [podeLerCertidoes]);

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
          <p className="muted">{t('dashboard.proximosPassosDescricaoV5')}</p>
        </Card>
      </div>

      {podeLerCertidoes ? (
        <section className="dashboard-management" aria-labelledby="dashboard-certidoes-gerencial">
          <div className="dashboard-management__header">
            <div>
              <h2 id="dashboard-certidoes-gerencial">{t('dashboard.certidoesGerencial.titulo')}</h2>
              <p>{t('dashboard.certidoesGerencial.descricao')}</p>
            </div>
            <Link className="button button--secundario" to="/certidoes">
              {t('certidoes.acoes.abrirCentro')}
            </Link>
          </div>
          {erroGerencial ? (
            <Alert tipo="erro">{t('dashboard.certidoesGerencial.erro')}</Alert>
          ) : gerencial ? (
            <ResumoCertidoes gerencial={gerencial} />
          ) : null}
        </section>
      ) : null}
    </>
  );
}

function ResumoCertidoes({ gerencial }: { gerencial: ResumoGerencialCertidoes }) {
  const { t } = useTranslation();
  const maiorTipo = useMemo(
    () => Math.max(1, ...tiposCertidao.map((tipo) => gerencial.porTipo[tipo] ?? 0)),
    [gerencial.porTipo],
  );
  const statusComDados = statusCertidao.filter((status) => (gerencial.porStatus[status] ?? 0) > 0);

  if (gerencial.totalAnalisadas === 0) {
    return <Card><p className="muted">{t('dashboard.certidoesGerencial.semDados')}</p></Card>;
  }

  return (
    <div className="stack">
      {gerencial.parcial ? (
        <Alert tipo="aviso">{t('dashboard.certidoesGerencial.parcial')}</Alert>
      ) : null}
      <div className="management-metrics">
        <Metric label={t('dashboard.certidoesGerencial.total')} value={gerencial.totalRegistradas} />
        <Metric label={t('dashboard.certidoesGerencial.atencao')} value={gerencial.atencao} tone="aviso" />
        <Metric label={t('dashboard.certidoesGerencial.emAndamento')} value={gerencial.emAndamento} tone="info" />
        <Metric label={t('dashboard.certidoesGerencial.vencem30Dias')} value={gerencial.vencemEmTrintaDias} tone="aviso" />
        <Metric label={t('dashboard.certidoesGerencial.semValidade')} value={gerencial.semValidade} />
      </div>
      <div className="detail-grid">
        <Card titulo={t('dashboard.certidoesGerencial.porTipo')}>
          <div className="distribution-list">
            {tiposCertidao.map((tipo) => {
              const quantidade = gerencial.porTipo[tipo] ?? 0;
              return (
                <div className="distribution-row" key={tipo}>
                  <div className="distribution-row__label">
                    <span>{t(`certidoes.tipos.${tipo}`)}</span>
                    <strong>{quantidade}</strong>
                  </div>
                  <div className="distribution-bar" aria-hidden="true">
                    <span style={{ width: `${Math.round((quantidade / maiorTipo) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card titulo={t('dashboard.certidoesGerencial.porStatus')}>
          <div className="status-summary-list">
            {statusComDados.map((status) => (
              <div key={status} className="status-summary-row">
                <StatusBadge tom={tomStatus(status)}>{t(`certidoes.status.${status}`)}</StatusBadge>
                <strong>{gerencial.porStatus[status] ?? 0}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="management-footnote">
        <span>{t('dashboard.certidoesGerencial.analisadas', {
          analisadas: gerencial.totalAnalisadas,
          total: gerencial.totalRegistradas,
        })}</span>
        {gerencial.ultimaAtualizacao ? (
          <span>{t('dashboard.certidoesGerencial.ultimaAtualizacao', {
            valor: formatarDataHora(gerencial.ultimaAtualizacao),
          })}</span>
        ) : null}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = 'neutro',
}: {
  label: string;
  value: number;
  tone?: 'neutro' | 'aviso' | 'info';
}) {
  return (
    <div className={`card management-metric management-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function tomStatus(status: StatusCertidao): 'sucesso' | 'aviso' | 'erro' | 'info' | 'neutro' {
  if (status === 'REGULAR') return 'sucesso';
  if (['IRREGULAR', 'VENCIDA', 'FALHA'].includes(status)) return 'erro';
  if (['POSITIVA_COM_EFEITO_NEGATIVA', 'INCOMPLETA', 'FONTE_INDISPONIVEL',
    'ACAO_MANUAL_NECESSARIA', 'PROXIMA_DO_VENCIMENTO'].includes(status)) return 'aviso';
  if (['AGENDADA', 'EM_PROCESSAMENTO'].includes(status)) return 'info';
  return 'neutro';
}

function formatarDataHora(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
