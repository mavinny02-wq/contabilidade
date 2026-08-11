import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../api/http';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

type HistoricoWorkerItem = {
  id: string;
  workerId: string;
  versao: string;
  status: string;
  observadoEm: string;
};

type HistoricoWorkersResponse = {
  inicio: string;
  fim: string;
  workerId?: string;
  total: number;
  saudavel: number;
  degradado: number;
  indisponivel: number;
  inicializando: number;
  desconhecido: number;
  parcial: boolean;
  itens: HistoricoWorkerItem[];
};

const hoje = new Date();
const inicioPadrao = dataLocal(adicionarDias(hoje, -7));
const fimPadrao = dataLocal(hoje);

export function HistoricoWorkersPage() {
  const { t } = useTranslation();
  const [inicio, setInicio] = useState(inicioPadrao);
  const [fim, setFim] = useState(fimPadrao);
  const [workerId, setWorkerId] = useState('');
  const [dados, setDados] = useState<HistoricoWorkersResponse>();
  const [erro, setErro] = useState<ApiError>();
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    const params = new URLSearchParams({ inicio, fim });
    if (workerId.trim()) params.set('workerId', workerId.trim());
    setCarregando(true);
    setErro(undefined);
    try {
      setDados(await api<HistoricoWorkersResponse>(`/console-tecnica/workers/historico?${params.toString()}`));
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setCarregando(false);
    }
  }, [fim, inicio, workerId]);

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
        titulo={t('historicoWorkers.titulo')}
        descricao={t('historicoWorkers.descricao')}
        acoes={<Button variante="secundario" onClick={() => void carregar()}>{t('acoes.atualizar')}</Button>}
      />

      {erro ? <Alert tipo="erro" onClose={() => setErro(undefined)}>{erro.mensagem ?? t('erros.inesperado')}</Alert> : null}
      {dados?.parcial ? <Alert tipo="aviso">{t('historicoWorkers.parcial', { total: dados.total, exibidos: dados.itens.length })}</Alert> : null}

      <Card>
        <form className="filter-grid" onSubmit={consultar}>
          <label className="field">
            <span>{t('historicoWorkers.inicio')}</span>
            <input type="date" required value={inicio} onChange={(event) => setInicio(event.target.value)} />
          </label>
          <label className="field">
            <span>{t('historicoWorkers.fim')}</span>
            <input type="date" required value={fim} onChange={(event) => setFim(event.target.value)} />
          </label>
          <label className="field">
            <span>{t('historicoWorkers.workerId')}</span>
            <input maxLength={120} value={workerId} onChange={(event) => setWorkerId(event.target.value)} />
          </label>
          <div className="form-actions">
            <Button type="submit" disabled={carregando}>{t('acoes.buscar')}</Button>
          </div>
        </form>
      </Card>

      {dados ? (
        <div className="metric-grid">
          <Card className="metric-card"><span>{t('historicoWorkers.total')}</span><strong>{dados.total}</strong></Card>
          <Card className="metric-card"><span>{t('historicoWorkers.saudavel')}</span><strong>{dados.saudavel}</strong></Card>
          <Card className="metric-card"><span>{t('historicoWorkers.degradado')}</span><strong>{dados.degradado}</strong></Card>
          <Card className="metric-card"><span>{t('historicoWorkers.indisponivel')}</span><strong>{dados.indisponivel}</strong></Card>
        </div>
      ) : null}

      {!carregando && dados?.itens.length === 0 ? (
        <EmptyState titulo={t('historicoWorkers.vazio')} descricao={t('historicoWorkers.vazioDescricao')} />
      ) : null}

      {dados && dados.itens.length > 0 ? (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('historicoWorkers.observadoEm')}</th>
                  <th>{t('historicoWorkers.workerId')}</th>
                  <th>{t('historicoWorkers.versao')}</th>
                  <th>{t('comum.status')}</th>
                </tr>
              </thead>
              <tbody>
                {dados.itens.map((item) => (
                  <tr key={item.id}>
                    <td>{formatarDataHora(item.observadoEm)}</td>
                    <td><code>{item.workerId}</code></td>
                    <td>{item.versao}</td>
                    <td><StatusBadge tom={tomStatus(item.status)}>{t(`historicoWorkers.status.${item.status}`, { defaultValue: item.status })}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
}

function tomStatus(status: string): 'sucesso' | 'aviso' | 'erro' | 'info' | 'neutro' {
  if (status === 'SAUDAVEL') return 'sucesso';
  if (status === 'DEGRADADO' || status === 'INICIALIZANDO') return 'aviso';
  if (status === 'INDISPONIVEL') return 'erro';
  return 'neutro';
}

function formatarDataHora(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value));
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
