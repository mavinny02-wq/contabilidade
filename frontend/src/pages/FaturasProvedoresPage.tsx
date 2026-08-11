import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../api/http';
import type { Pagina, Provedor } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

type SituacaoReconciliacao = 'SEM_DIVERGENCIA' | 'ACIMA_ESTIMADO' | 'ABAIXO_ESTIMADO';

type FaturaProvedor = {
  id: string;
  provedorCodigo: string;
  competenciaInicio: string;
  competenciaFim: string;
  moeda: string;
  valorFaturado: number;
  valorEstimado: number;
  diferenca: number;
  situacao: SituacaoReconciliacao;
  referencia?: string;
  observacao?: string;
  atualizadoEm: string;
};

const hoje = new Date();
const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;
const fimMes = dataLocal(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0));

export function FaturasProvedoresPage() {
  const { t } = useTranslation();
  const { temPermissao } = useAuth();
  const [provedores, setProvedores] = useState<Provedor[]>([]);
  const [faturas, setFaturas] = useState<FaturaProvedor[]>([]);
  const [filtroProvedor, setFiltroProvedor] = useState('');
  const [provedorCodigo, setProvedorCodigo] = useState('');
  const [competenciaInicio, setCompetenciaInicio] = useState(inicioMes);
  const [competenciaFim, setCompetenciaFim] = useState(fimMes);
  const [moeda, setMoeda] = useState('BRL');
  const [valorFaturado, setValorFaturado] = useState('');
  const [referencia, setReferencia] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState<ApiError>();
  const [mensagem, setMensagem] = useState('');
  const [salvando, setSalvando] = useState(false);

  const editavel = temPermissao(PERMISSOES.INTEGRACAO_EDITAR);

  const carregar = useCallback(() => {
    const query = filtroProvedor ? `?provedorCodigo=${encodeURIComponent(filtroProvedor)}&tamanho=100` : '?tamanho=100';
    setErro(undefined);
    void api<Pagina<FaturaProvedor>>(`/integracoes/faturas${query}`)
      .then((response) => setFaturas(response.content))
      .catch((exception) => setErro(exception as ApiError));
  }, [filtroProvedor]);

  useEffect(() => {
    void api<Provedor[]>('/integracoes/provedores')
      .then((response) => {
        setProvedores(response);
        if (response.length > 0) setProvedorCodigo((atual) => atual || response[0].codigo);
      })
      .catch((exception) => setErro(exception as ApiError));
  }, []);

  useEffect(carregar, [carregar]);

  const salvar = async (event: FormEvent) => {
    event.preventDefault();
    if (!provedorCodigo || !valorFaturado) return;
    setSalvando(true);
    setErro(undefined);
    try {
      await api<FaturaProvedor>('/integracoes/faturas', {
        method: 'POST',
        body: JSON.stringify({
          provedorCodigo,
          competenciaInicio,
          competenciaFim,
          moeda,
          valorFaturado: Number(valorFaturado),
          referencia: referencia || null,
          observacao: observacao || null,
        }),
      });
      setMensagem(t('faturasProvedores.mensagemSalva'));
      setValorFaturado('');
      setReferencia('');
      setObservacao('');
      carregar();
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <PageHeader
        titulo={t('faturasProvedores.titulo')}
        descricao={t('faturasProvedores.descricao')}
        acoes={<Button variante="secundario" onClick={carregar}>{t('acoes.atualizar')}</Button>}
      />

      {mensagem ? <Alert tipo="sucesso" onClose={() => setMensagem('')}>{mensagem}</Alert> : null}
      {erro ? <Alert tipo="erro" onClose={() => setErro(undefined)}>{erro.mensagem ?? t('erros.inesperado')}</Alert> : null}

      {editavel ? (
        <Card titulo={t('faturasProvedores.registrar')}>
          <form className="form-grid form-grid--compact" onSubmit={salvar}>
            <label className="field">
              <span>{t('faturasProvedores.provedor')}</span>
              <select required value={provedorCodigo} onChange={(event) => setProvedorCodigo(event.target.value)}>
                {provedores.map((provedor) => (
                  <option key={provedor.codigo} value={provedor.codigo}>{provedor.nome}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t('faturasProvedores.inicio')}</span>
              <input type="date" required value={competenciaInicio} onChange={(event) => setCompetenciaInicio(event.target.value)} />
            </label>
            <label className="field">
              <span>{t('faturasProvedores.fim')}</span>
              <input type="date" required value={competenciaFim} onChange={(event) => setCompetenciaFim(event.target.value)} />
            </label>
            <label className="field">
              <span>{t('faturasProvedores.moeda')}</span>
              <input required maxLength={3} value={moeda} onChange={(event) => setMoeda(event.target.value.toUpperCase())} />
            </label>
            <label className="field">
              <span>{t('faturasProvedores.valorFaturado')}</span>
              <input type="number" required min="0" step="0.0001" value={valorFaturado} onChange={(event) => setValorFaturado(event.target.value)} />
            </label>
            <label className="field">
              <span>{t('faturasProvedores.referencia')}</span>
              <input maxLength={120} value={referencia} onChange={(event) => setReferencia(event.target.value)} />
            </label>
            <label className="field field--wide">
              <span>{t('faturasProvedores.observacao')}</span>
              <textarea maxLength={500} rows={3} value={observacao} onChange={(event) => setObservacao(event.target.value)} />
            </label>
            <div className="form-actions field--wide">
              <Button type="submit" disabled={salvando || provedores.length === 0}>{t('acoes.salvar')}</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card>
        <label className="field">
          <span>{t('faturasProvedores.filtrarProvedor')}</span>
          <select value={filtroProvedor} onChange={(event) => setFiltroProvedor(event.target.value)}>
            <option value="">{t('faturasProvedores.todosProvedores')}</option>
            {provedores.map((provedor) => (
              <option key={provedor.codigo} value={provedor.codigo}>{provedor.nome}</option>
            ))}
          </select>
        </label>
      </Card>

      {faturas.length === 0 ? (
        <EmptyState titulo={t('faturasProvedores.vazio')} descricao={t('faturasProvedores.vazioDescricao')} />
      ) : (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('faturasProvedores.competencia')}</th>
                  <th>{t('faturasProvedores.provedor')}</th>
                  <th>{t('faturasProvedores.valorEstimado')}</th>
                  <th>{t('faturasProvedores.valorFaturado')}</th>
                  <th>{t('faturasProvedores.diferenca')}</th>
                  <th>{t('comum.status')}</th>
                  <th>{t('faturasProvedores.referencia')}</th>
                </tr>
              </thead>
              <tbody>
                {faturas.map((fatura) => (
                  <tr key={fatura.id}>
                    <td>{formatarData(fatura.competenciaInicio)} — {formatarData(fatura.competenciaFim)}</td>
                    <td><code>{fatura.provedorCodigo}</code></td>
                    <td>{formatarMoeda(fatura.valorEstimado, fatura.moeda)}</td>
                    <td>{formatarMoeda(fatura.valorFaturado, fatura.moeda)}</td>
                    <td>{formatarMoeda(fatura.diferenca, fatura.moeda)}</td>
                    <td>
                      <StatusBadge tom={fatura.situacao === 'SEM_DIVERGENCIA' ? 'sucesso' : 'aviso'}>
                        {t(`faturasProvedores.situacoes.${fatura.situacao}`)}
                      </StatusBadge>
                    </td>
                    <td>{fatura.referencia ?? t('comum.naoInformado')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`));
}

function formatarMoeda(value: number, moeda: string) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda }).format(value);
  } catch {
    return `${moeda} ${value.toFixed(4)}`;
  }
}

function dataLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}
