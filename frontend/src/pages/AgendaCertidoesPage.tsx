import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api, type ApiError } from '../api/http';
import type { EmpresaResumo, Pagina, StatusCertidao, TipoCertidao } from '../api/types';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

type AgendaItem = {
  acompanhamentoId: string;
  empresaId: string;
  empresaRazaoSocial: string;
  estabelecimentoId: string;
  cnpj: string;
  tipo: TipoCertidao;
  status: StatusCertidao;
  validaAte: string;
  diasParaVencimento: number;
  documentoId?: string;
};

type AgendaResponse = {
  inicio: string;
  fim: string;
  empresaId?: string;
  total: number;
  parcial: boolean;
  itens: AgendaItem[];
};

export function AgendaCertidoesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hoje = dataLocal(new Date());
  const [inicio, setInicio] = useState(hoje);
  const [fim, setFim] = useState(dataLocal(adicionarDias(new Date(), 90)));
  const [empresaId, setEmpresaId] = useState('');
  const [empresas, setEmpresas] = useState<EmpresaResumo[]>([]);
  const [agenda, setAgenda] = useState<AgendaResponse>();
  const [erro, setErro] = useState<ApiError>();
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    void api<Pagina<EmpresaResumo>>('/empresas?pagina=0&tamanho=100&termo=')
      .then((response) => setEmpresas(response.content))
      .catch(() => undefined);
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(undefined);
    const params = new URLSearchParams({ inicio, fim });
    if (empresaId) params.set('empresaId', empresaId);
    try {
      setAgenda(await api<AgendaResponse>(`/certidoes/agenda-vencimentos?${params.toString()}`));
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setCarregando(false);
    }
  }, [empresaId, fim, inicio]);

  useEffect(() => {
    void carregar();
  }, []); // consulta inicial deliberadamente executada uma vez

  const consultar = (event: FormEvent) => {
    event.preventDefault();
    void carregar();
  };

  return (
    <>
      <PageHeader
        titulo={t('certidoes.agenda.titulo')}
        descricao={t('certidoes.agenda.descricao')}
        acoes={
          <Button variante="secundario" onClick={() => navigate('/certidoes')}>
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
            <span>{t('certidoes.agenda.inicio')}</span>
            <input type="date" required value={inicio} onChange={(event) => setInicio(event.target.value)} />
          </label>
          <label className="field">
            <span>{t('certidoes.agenda.fim')}</span>
            <input type="date" required value={fim} onChange={(event) => setFim(event.target.value)} />
          </label>
          <label className="field">
            <span>{t('documentos.selecionarEmpresa')}</span>
            <select value={empresaId} onChange={(event) => setEmpresaId(event.target.value)}>
              <option value="">{t('certidoes.todasEmpresas')}</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>{empresa.razaoSocial}</option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            <Button type="submit" disabled={carregando}>{t('acoes.buscar')}</Button>
          </div>
        </form>
      </Card>

      {agenda?.parcial ? (
        <Alert tipo="aviso">{t('certidoes.agenda.parcial', { quantidade: agenda.itens.length, total: agenda.total })}</Alert>
      ) : null}

      {agenda ? (
        <div className="metric-grid">
          <Card className="metric-card">
            <span>{t('certidoes.agenda.total')}</span>
            <strong>{agenda.total}</strong>
          </Card>
          <Card className="metric-card">
            <span>{t('certidoes.agenda.periodo')}</span>
            <strong>{formatarData(agenda.inicio)} — {formatarData(agenda.fim)}</strong>
          </Card>
          <Card className="metric-card">
            <span>{t('certidoes.agenda.empresas')}</span>
            <strong>{new Set(agenda.itens.map((item) => item.empresaId)).size}</strong>
          </Card>
        </div>
      ) : null}

      {!carregando && agenda?.itens.length === 0 ? (
        <EmptyState titulo={t('certidoes.agenda.vazio')} descricao={t('certidoes.agenda.vazioDescricao')} />
      ) : null}

      {agenda && agenda.itens.length > 0 ? (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('certidoes.agenda.validade')}</th>
                  <th>{t('empresas.titulo')}</th>
                  <th>{t('empresas.campos.cnpj')}</th>
                  <th>{t('certidoes.campos.tipo')}</th>
                  <th>{t('comum.status')}</th>
                  <th>{t('certidoes.agenda.prazo')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {agenda.itens.map((item) => (
                  <tr key={item.acompanhamentoId}>
                    <td><strong>{formatarData(item.validaAte)}</strong></td>
                    <td>{item.empresaRazaoSocial}</td>
                    <td>{formatarCnpj(item.cnpj)}</td>
                    <td>{t(`certidoes.tipos.${item.tipo}`)}</td>
                    <td><StatusBadge tom={tomStatus(item.status)}>{t(`certidoes.status.${item.status}`)}</StatusBadge></td>
                    <td>{formatarPrazo(t, item.diasParaVencimento)}</td>
                    <td className="table-actions">
                      <Button variante="texto" onClick={() => navigate(`/certidoes?empresaId=${item.empresaId}`)}>
                        {t('certidoes.agenda.abrirCentro')}
                      </Button>
                    </td>
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

function tomStatus(status: StatusCertidao): 'sucesso' | 'aviso' | 'erro' | 'info' | 'neutro' {
  if (status === 'REGULAR') return 'sucesso';
  if (['IRREGULAR', 'VENCIDA', 'FALHA'].includes(status)) return 'erro';
  if (['POSITIVA_COM_EFEITO_NEGATIVA', 'INCOMPLETA', 'FONTE_INDISPONIVEL', 'ACAO_MANUAL_NECESSARIA', 'PROXIMA_DO_VENCIMENTO'].includes(status)) return 'aviso';
  if (['AGENDADA', 'EM_PROCESSAMENTO'].includes(status)) return 'info';
  return 'neutro';
}

function formatarPrazo(t: ReturnType<typeof useTranslation>['t'], dias: number) {
  if (dias < 0) return t('certidoes.agenda.vencidaHa', { dias: Math.abs(dias) });
  if (dias === 0) return t('certidoes.agenda.venceHoje');
  return t('certidoes.agenda.venceEm', { dias });
}

function formatarCnpj(cnpj: string) {
  return cnpj.length === 14
    ? cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    : cnpj;
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`));
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
