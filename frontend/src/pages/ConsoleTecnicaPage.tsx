import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/http';
import type { ResumoTecnico } from '../api/types';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

export function ConsoleTecnicaPage() {
  const { t } = useTranslation();
  const [resumo, setResumo] = useState<ResumoTecnico>();
  const [erro, setErro] = useState(false);

  const carregar = useCallback(() => {
    setErro(false);
    void api<ResumoTecnico>('/console-tecnica/resumo')
      .then(setResumo)
      .catch(() => setErro(true));
  }, []);

  useEffect(carregar, [carregar]);

  return (
    <>
      <PageHeader
        titulo={t('consoleTecnica.titulo')}
        descricao={t('consoleTecnica.descricao')}
        acoes={<Button variante="secundario" onClick={carregar}>{t('acoes.atualizar')}</Button>}
      />
      {erro ? <Alert tipo="erro">{t('comum.erroCarregamento')}</Alert> : null}
      {resumo ? (
        <>
          <div className="metric-grid">
            <Card className="metric-card">
              <span>{t('dashboard.execucoesAbertas')}</span>
              <strong>{resumo.execucoesAbertas}</strong>
            </Card>
            <Card className="metric-card">
              <span>{t('consoleTecnica.falhas')}</span>
              <strong>{resumo.execucoesComFalha}</strong>
            </Card>
            <Card className="metric-card">
              <span>{t('dashboard.intervencoesPendentes')}</span>
              <strong>{resumo.intervencoesPendentes}</strong>
            </Card>
          </div>
          <div className="detail-grid">
            <Componente titulo={t('consoleTecnica.banco')} status={resumo.banco.status} detalhe={resumo.banco.detalheSeguro} />
            <Componente titulo={t('consoleTecnica.storage')} status={resumo.storage.status} detalhe={resumo.storage.detalheSeguro} />
          </div>
          <p className="muted">{t('consoleTecnica.observadoEm')}: {formatarData(resumo.observadoEm)}</p>
        </>
      ) : null}
    </>
  );
}

function Componente({ titulo, status, detalhe }: { titulo: string; status: string; detalhe?: string }) {
  const { t } = useTranslation();
  const chave = status === 'SAUDAVEL' ? 'consoleTecnica.saudavel' : status === 'DEGRADADO' ? 'consoleTecnica.degradado' : 'consoleTecnica.indisponivel';
  const tom: 'sucesso' | 'aviso' | 'erro' = status === 'SAUDAVEL' ? 'sucesso' : status === 'DEGRADADO' ? 'aviso' : 'erro';
  return (
    <Card>
      <div className="card-row__title">
        <strong>{titulo}</strong>
        <StatusBadge tom={tom}>{t(chave)}</StatusBadge>
      </div>
      {detalhe ? <p className="muted">{detalhe}</p> : null}
    </Card>
  );
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
