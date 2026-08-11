import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../api/http';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

type Aviso = {
  codigo: string;
  componente: string;
};

type ProvedorSeguro = {
  codigo: string;
  nome: string;
  tipo: string;
  habilitado: boolean;
  pago: boolean;
  baseUrlConfigurada: boolean;
  referenciaSegredoConfigurada: boolean;
  custoConfigurado: boolean;
  moedaConfigurada: boolean;
  timeoutSegundos: number;
  maxRetries: number;
};

type ConfiguracaoSegura = {
  observadoEm: string;
  status: 'SAUDAVEL' | 'DEGRADADO';
  ambiente: string;
  versao: string;
  segurancaHabilitada: boolean;
  storageProvider: string;
  workerTokenConfigurado: boolean;
  segredoSessaoConfigurado: boolean;
  ticketTtl: string;
  provedoresTotal: number;
  provedoresHabilitados: number;
  provedoresPagosHabilitados: number;
  avisos: Aviso[];
  provedores: ProvedorSeguro[];
};

export function ConfiguracaoSeguraPage() {
  const { t } = useTranslation();
  const [dados, setDados] = useState<ConfiguracaoSegura>();
  const [erro, setErro] = useState<ApiError>();
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(undefined);
    try {
      setDados(await api<ConfiguracaoSegura>('/console-tecnica/configuracao'));
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <>
      <PageHeader
        titulo={t('configuracaoSegura.titulo')}
        descricao={t('configuracaoSegura.descricao')}
        acoes={
          <Button variante="secundario" disabled={carregando} onClick={() => void carregar()}>
            {t('acoes.atualizar')}
          </Button>
        }
      />
      {erro ? (
        <Alert tipo="erro" onClose={() => setErro(undefined)}>
          <strong>{erro.mensagem ?? t('erros.inesperado')}</strong>
          {erro.correlationId ? <small>{t('erros.correlationId', { valor: erro.correlationId })}</small> : null}
        </Alert>
      ) : null}
      {dados?.avisos.map((aviso) => (
        <Alert key={`${aviso.codigo}:${aviso.componente}`} tipo="aviso">
          <strong>{motivo(t, aviso.codigo)}</strong>
          <small>{t('configuracaoSegura.componente', { componente: aviso.componente })}</small>
        </Alert>
      ))}

      {dados ? (
        <>
          <div className="metric-grid">
            <Card className="metric-card">
              <span>{t('configuracaoSegura.status')}</span>
              <StatusBadge tom={dados.status === 'SAUDAVEL' ? 'sucesso' : 'aviso'}>
                {t(`configuracaoSegura.statusValores.${dados.status}`)}
              </StatusBadge>
            </Card>
            <Card className="metric-card">
              <span>{t('configuracaoSegura.ambiente')}</span>
              <strong>{dados.ambiente}</strong>
            </Card>
            <Card className="metric-card">
              <span>{t('configuracaoSegura.versao')}</span>
              <strong>{dados.versao}</strong>
            </Card>
            <Card className="metric-card">
              <span>{t('configuracaoSegura.provedoresHabilitados')}</span>
              <strong>{dados.provedoresHabilitados} / {dados.provedoresTotal}</strong>
            </Card>
          </div>

          <div className="detail-grid">
            <ComponenteSeguro
              titulo={t('configuracaoSegura.seguranca')}
              configurado={dados.segurancaHabilitada}
            />
            <ComponenteSeguro
              titulo={t('configuracaoSegura.workerToken')}
              configurado={dados.workerTokenConfigurado}
            />
            <ComponenteSeguro
              titulo={t('configuracaoSegura.segredoSessao')}
              configurado={dados.segredoSessaoConfigurado}
            />
            <Card>
              <strong>{t('configuracaoSegura.storage')}</strong>
              <p className="muted">{dados.storageProvider}</p>
            </Card>
            <Card>
              <strong>{t('configuracaoSegura.ticketTtl')}</strong>
              <p className="muted">{dados.ticketTtl}</p>
            </Card>
            <Card>
              <strong>{t('configuracaoSegura.provedoresPagos')}</strong>
              <p className="muted">{dados.provedoresPagosHabilitados}</p>
            </Card>
          </div>

          {dados.provedores.length === 0 ? (
            <EmptyState titulo={t('configuracaoSegura.semProvedores')} />
          ) : (
            <div className="table-card">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t('configuracaoSegura.provedor')}</th>
                      <th>{t('comum.status')}</th>
                      <th>{t('configuracaoSegura.baseUrl')}</th>
                      <th>{t('configuracaoSegura.referenciaSegredo')}</th>
                      <th>{t('configuracaoSegura.custo')}</th>
                      <th>{t('configuracaoSegura.timeout')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.provedores.map((provedor) => (
                      <tr key={provedor.codigo}>
                        <td>
                          <strong>{provedor.nome}</strong>
                          <span className="table-secondary">{provedor.codigo} · {provedor.tipo}</span>
                        </td>
                        <td>
                          <StatusBadge tom={provedor.habilitado ? 'sucesso' : 'neutro'}>
                            {t(provedor.habilitado ? 'comum.sim' : 'comum.nao')}
                          </StatusBadge>
                        </td>
                        <td><BooleanoSeguro valor={provedor.baseUrlConfigurada} /></td>
                        <td><BooleanoSeguro valor={provedor.referenciaSegredoConfigurada} /></td>
                        <td>
                          {provedor.pago ? (
                            <BooleanoSeguro valor={provedor.custoConfigurado && provedor.moedaConfigurada} />
                          ) : t('configuracaoSegura.naoAplicavel')}
                        </td>
                        <td>{provedor.timeoutSegundos}s · {provedor.maxRetries} retry(s)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <p className="muted">
            {t('configuracaoSegura.observadoEm', { valor: formatarData(dados.observadoEm) })}
          </p>
          <Alert tipo="info">{t('configuracaoSegura.naoExibeValores')}</Alert>
        </>
      ) : null}
    </>
  );
}

function ComponenteSeguro({ titulo, configurado }: { titulo: string; configurado: boolean }) {
  const { t } = useTranslation();
  return (
    <Card>
      <div className="card-row__title">
        <strong>{titulo}</strong>
        <StatusBadge tom={configurado ? 'sucesso' : 'aviso'}>
          {t(configurado ? 'configuracaoSegura.configurado' : 'configuracaoSegura.revisar')}
        </StatusBadge>
      </div>
    </Card>
  );
}

function BooleanoSeguro({ valor }: { valor: boolean }) {
  const { t } = useTranslation();
  return (
    <StatusBadge tom={valor ? 'sucesso' : 'aviso'}>
      {t(valor ? 'configuracaoSegura.configurado' : 'configuracaoSegura.revisar')}
    </StatusBadge>
  );
}

function motivo(t: ReturnType<typeof useTranslation>['t'], codigo: string) {
  const chave = `configuracaoSegura.avisos.${codigo}`;
  const traduzido = t(chave);
  return traduzido === chave ? codigo : traduzido;
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
