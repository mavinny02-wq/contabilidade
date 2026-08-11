import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api, type ApiError } from '../api/http';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

type Custo = {
  moeda: string;
  totalEstimado: number;
};

type ProvedorHistorico = {
  codigo: string;
  total: number;
  sucesso: number;
  parcial: number;
  falha: number;
  fonteIndisponivel: number;
  cancelada: number;
  aberta: number;
  taxaSucessoPercentual: number;
  duracaoMediaSegundos?: number;
  ultimaExecucaoEm?: string;
  custos: Custo[];
};

type HistoricoResponse = {
  inicio: string;
  fimExclusivo: string;
  totalExecucoes: number;
  totalProvedores: number;
  parcial: boolean;
  provedores: ProvedorHistorico[];
};

export function HistoricoProvedoresPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hoje = new Date();
  const [inicio, setInicio] = useState(dataLocal(adicionarDias(hoje, -29)));
  const [fim, setFim] = useState(dataLocal(hoje));
  const [dados, setDados] = useState<HistoricoResponse>();
  const [erro, setErro] = useState<ApiError>();
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(undefined);
    try {
      const params = new URLSearchParams({ inicio, fim });
      setDados(await api<HistoricoResponse>(`/integracoes/provedores/historico?${params.toString()}`));
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setCarregando(false);
    }
  }, [fim, inicio]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const consultar = (event: FormEvent) => {
    event.preventDefault();
    void carregar();
  };

  return (
    <>
      <PageHeader
        titulo={t('historicoProvedores.titulo')}
        descricao={t('historicoProvedores.descricao')}
        acoes={
          <Button variante="secundario" onClick={() => navigate('/integracoes')}>
            {t('acoes.voltar')}
          </Button>
        }
      />
      {erro ? (
        <Alert tipo="erro" onClose={() => setErro(undefined)}>
          <strong>{erro.mensagem ?? t('erros.inesperado')}</strong>
          {erro.correlationId ? <small>{t('erros.correlationId', { valor: erro.correlationId })}</small> : null}
        </Alert>
      ) : null}

      <Card>
        <form className="filter-grid" onSubmit={consultar}>
          <label className="field">
            <span>{t('historicoProvedores.inicio')}</span>
            <input type="date" value={inicio} required onChange={(event) => setInicio(event.target.value)} />
          </label>
          <label className="field">
            <span>{t('historicoProvedores.fim')}</span>
            <input type="date" value={fim} required onChange={(event) => setFim(event.target.value)} />
          </label>
          <div className="form-actions">
            <Button type="submit" disabled={carregando}>{t('acoes.buscar')}</Button>
          </div>
        </form>
      </Card>

      {dados?.parcial ? (
        <Alert tipo="aviso">
          {t('historicoProvedores.parcial', {
            exibidos: dados.provedores.length,
            total: dados.totalProvedores,
          })}
        </Alert>
      ) : null}

      {dados ? (
        <div className="metric-grid">
          <Card className="metric-card">
            <span>{t('historicoProvedores.totalExecucoes')}</span>
            <strong>{dados.totalExecucoes}</strong>
          </Card>
          <Card className="metric-card">
            <span>{t('historicoProvedores.totalProvedores')}</span>
            <strong>{dados.totalProvedores}</strong>
          </Card>
          <Card className="metric-card">
            <span>{t('historicoProvedores.periodo')}</span>
            <strong>{formatarDataHora(dados.inicio)} — {formatarFimExclusivo(dados.fimExclusivo)}</strong>
          </Card>
        </div>
      ) : null}

      {!carregando && dados?.provedores.length === 0 ? (
        <EmptyState titulo={t('historicoProvedores.vazio')} descricao={t('historicoProvedores.vazioDescricao')} />
      ) : null}

      {dados && dados.provedores.length > 0 ? (
        <div className="card-list">
          {dados.provedores.map((provedor) => (
            <Card key={provedor.codigo}>
              <div className="card-row__title">
                <strong>{provedor.codigo}</strong>
                <StatusBadge tom={tomTaxa(provedor.taxaSucessoPercentual)}>
                  {t('historicoProvedores.taxa', { valor: formatarNumero(provedor.taxaSucessoPercentual) })}
                </StatusBadge>
              </div>
              <div className="metric-grid">
                <Metrica label={t('historicoProvedores.total')} valor={provedor.total} />
                <Metrica label={t('historicoProvedores.sucesso')} valor={provedor.sucesso} />
                <Metrica label={t('historicoProvedores.parciais')} valor={provedor.parcial} />
                <Metrica label={t('historicoProvedores.falhas')} valor={provedor.falha} />
                <Metrica label={t('historicoProvedores.indisponiveis')} valor={provedor.fonteIndisponivel} />
                <Metrica label={t('historicoProvedores.abertas')} valor={provedor.aberta} />
              </div>
              <dl className="definition-list definition-list--compact">
                <div>
                  <dt>{t('historicoProvedores.duracaoMedia')}</dt>
                  <dd>{provedor.duracaoMediaSegundos == null
                    ? t('comum.naoInformado')
                    : formatarDuracao(provedor.duracaoMediaSegundos)}</dd>
                </div>
                <div>
                  <dt>{t('historicoProvedores.ultimaExecucao')}</dt>
                  <dd>{provedor.ultimaExecucaoEm
                    ? formatarDataHora(provedor.ultimaExecucaoEm)
                    : t('comum.naoInformado')}</dd>
                </div>
                <div>
                  <dt>{t('historicoProvedores.custos')}</dt>
                  <dd>{provedor.custos.length === 0
                    ? t('historicoProvedores.semCusto')
                    : provedor.custos.map((custo) => formatarMoeda(custo.totalEstimado, custo.moeda)).join(' · ')}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      ) : null}
    </>
  );
}

function Metrica({ label, valor }: { label: string; valor: number }) {
  return (
    <Card className="metric-card">
      <span>{label}</span>
      <strong>{valor}</strong>
    </Card>
  );
}

function tomTaxa(taxa: number): 'sucesso' | 'aviso' | 'erro' {
  if (taxa >= 95) return 'sucesso';
  if (taxa >= 80) return 'aviso';
  return 'erro';
}

function formatarNumero(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
}

function formatarMoeda(value: number, moeda: string) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda }).format(value);
  } catch {
    return `${formatarNumero(value)} ${moeda}`;
  }
}

function formatarDuracao(segundos: number) {
  if (segundos < 60) return `${formatarNumero(segundos)} s`;
  if (segundos < 3_600) return `${formatarNumero(segundos / 60)} min`;
  return `${formatarNumero(segundos / 3_600)} h`;
}

function formatarDataHora(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatarFimExclusivo(value: string) {
  const data = new Date(value);
  data.setMilliseconds(data.getMilliseconds() - 1);
  return new Intl.DateTimeFormat('pt-BR').format(data);
}

function adicionarDias(data: Date, dias: number) {
  const copia = new Date(data);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

function dataLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}
