import { useCallback, useEffect, useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { api } from '../api/http';
import type {
  ResumoTecnico,
  StatusTecnico,
  WorkerTecnico,
} from '../api/technical';
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
            <Componente
              titulo={t('consoleTecnica.banco')}
              status={resumo.banco.status}
              detalhe={resumo.banco.detalheSeguro}
            />
            <Componente
              titulo={t('consoleTecnica.storage')}
              status={resumo.storage.status}
              detalhe={resumo.storage.detalheSeguro}
            />
            <Componente
              titulo={t('consoleTecnica.worker.titulo')}
              status={resumo.worker.status}
              detalhe={motivoWorker(t, resumo.worker.detalheSeguro)}
            />
          </div>

          <div className="card-row__title console-technical__workers-title">
            <h2>{t('consoleTecnica.worker.listaTitulo')}</h2>
            <StatusBadge tom="neutro">
              {t('consoleTecnica.worker.registrados', { quantidade: resumo.workersRegistrados })}
            </StatusBadge>
          </div>
          <p className="muted">
            {t('consoleTecnica.worker.limiares', {
              degradado: formatarIdade(resumo.workerDegradadoAposSegundos, t),
              indisponivel: formatarIdade(resumo.workerIndisponivelAposSegundos, t),
            })}
          </p>
          {resumo.workersListaLimitada ? (
            <Alert tipo="info">{t('consoleTecnica.worker.listaLimitada')}</Alert>
          ) : null}
          {resumo.workers.length === 0 ? (
            <Alert tipo="aviso">{t('consoleTecnica.worker.nenhum')}</Alert>
          ) : (
            <div className="card-list">
              {resumo.workers.map((worker) => (
                <WorkerCard key={worker.workerId} worker={worker} />
              ))}
            </div>
          )}

          <p className="muted">{t('consoleTecnica.observadoEm')}: {formatarData(resumo.observadoEm)}</p>
        </>
      ) : null}
    </>
  );
}

function WorkerCard({ worker }: { worker: WorkerTecnico }) {
  const { t } = useTranslation();
  return (
    <Card className="card-row">
      <div>
        <div className="card-row__title">
          <strong>{worker.workerId}</strong>
          <Status status={worker.status} />
        </div>
        <p className="muted">
          {t('consoleTecnica.worker.versao')}: {worker.versao}
        </p>
        <small>
          {t('consoleTecnica.worker.ultimoHeartbeat')}:{' '}
          {worker.ultimoHeartbeatEm
            ? formatarData(worker.ultimoHeartbeatEm)
            : t('comum.naoInformado')}
          {' · '}
          {t('consoleTecnica.worker.idade')}: {formatarIdade(worker.idadeSegundos, t)}
        </small>
        {worker.motivoSeguro ? (
          <p className="muted">{motivoWorker(t, worker.motivoSeguro)}</p>
        ) : null}
      </div>
    </Card>
  );
}

function Componente({
  titulo,
  status,
  detalhe,
}: {
  titulo: string;
  status: StatusTecnico;
  detalhe?: string;
}) {
  return (
    <Card>
      <div className="card-row__title">
        <strong>{titulo}</strong>
        <Status status={status} />
      </div>
      {detalhe ? <p className="muted">{detalhe}</p> : null}
    </Card>
  );
}

function Status({ status }: { status: StatusTecnico }) {
  const { t } = useTranslation();
  const chave = status === 'SAUDAVEL'
    ? 'consoleTecnica.saudavel'
    : status === 'DEGRADADO'
      ? 'consoleTecnica.degradado'
      : 'consoleTecnica.indisponivel';
  const tom: 'sucesso' | 'aviso' | 'erro' = status === 'SAUDAVEL'
    ? 'sucesso'
    : status === 'DEGRADADO'
      ? 'aviso'
      : 'erro';
  return <StatusBadge tom={tom}>{t(chave)}</StatusBadge>;
}

function motivoWorker(t: TFunction, motivo?: string): string | undefined {
  switch (motivo) {
    case 'SEM_HEARTBEAT_REGISTRADO':
      return t('consoleTecnica.worker.motivos.semHeartbeatRegistrado');
    case 'NENHUM_WORKER_SAUDAVEL':
      return t('consoleTecnica.worker.motivos.nenhumWorkerSaudavel');
    case 'TODOS_WORKERS_INDISPONIVEIS':
      return t('consoleTecnica.worker.motivos.todosWorkersIndisponiveis');
    case 'HEARTBEAT_SEM_DATA':
      return t('consoleTecnica.worker.motivos.heartbeatSemData');
    case 'HEARTBEAT_RELOGIO_DIVERGENTE':
      return t('consoleTecnica.worker.motivos.relogioDivergente');
    case 'HEARTBEAT_EXPIRADO':
      return t('consoleTecnica.worker.motivos.heartbeatExpirado');
    case 'HEARTBEAT_ATRASADO':
      return t('consoleTecnica.worker.motivos.heartbeatAtrasado');
    case 'WORKER_INICIALIZANDO':
      return t('consoleTecnica.worker.motivos.workerInicializando');
    case 'STATUS_REPORTADO_DEGRADADO':
      return t('consoleTecnica.worker.motivos.statusDegradado');
    case 'STATUS_REPORTADO_INDISPONIVEL':
      return t('consoleTecnica.worker.motivos.statusIndisponivel');
    case 'STATUS_REPORTADO_DESCONHECIDO':
      return t('consoleTecnica.worker.motivos.statusDesconhecido');
    default:
      return undefined;
  }
}

function formatarIdade(segundos: number, t: TFunction): string {
  if (segundos < 60) {
    return t('consoleTecnica.worker.tempo.segundos', { quantidade: Math.max(0, Math.floor(segundos)) });
  }
  if (segundos < 3_600) {
    return t('consoleTecnica.worker.tempo.minutos', { quantidade: Math.floor(segundos / 60) });
  }
  return t('consoleTecnica.worker.tempo.horas', { quantidade: Math.floor(segundos / 3_600) });
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
