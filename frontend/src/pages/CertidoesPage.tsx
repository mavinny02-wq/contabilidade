import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, baixarArquivo, type ApiError } from '../api/http';
import type { Certidao, EmpresaResumo, Pagina, StatusCertidao, TipoCertidao } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { CertidaoHistoryModal } from '../features/certidoes/CertidaoHistoryModal';
import { CertidaoManualModal } from '../features/certidoes/CertidaoManualModal';

const tipos: TipoCertidao[] = [
  'FEDERAL_RFB_PGFN',
  'SP_SEFAZ_NAO_INSCRITOS',
  'SP_PGE_DIVIDA_ATIVA',
];

type SolicitacaoLoteResponse = {
  loteId: string;
  recebidas: number;
  unicas: number;
  aceitas: number;
  rejeitadas: number;
  itens: Array<{
    id: string;
    aceita: boolean;
    codigo: string;
    situacaoConsulta?: string;
    execucaoId?: string;
  }>;
};

export function CertidoesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { temPermissao } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [empresas, setEmpresas] = useState<EmpresaResumo[]>([]);
  const [empresaId, setEmpresaId] = useState(searchParams.get('empresaId') ?? '');
  const [certidoes, setCertidoes] = useState<Certidao[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<TipoCertidao | ''>('');
  const [filtroStatus, setFiltroStatus] = useState<StatusCertidao | ''>('');
  const [erro, setErro] = useState<ApiError>();
  const [mensagem, setMensagem] = useState('');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [solicitandoLote, setSolicitandoLote] = useState(false);
  const [manual, setManual] = useState<Certidao>();
  const [historico, setHistorico] = useState<Certidao>();
  const [solicitando, setSolicitando] = useState<Set<string>>(new Set());
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());

  const podeSolicitar = temPermissao(PERMISSOES.CERTIDAO_SOLICITAR);

  useEffect(() => {
    void api<Pagina<EmpresaResumo>>('/empresas?pagina=0&tamanho=100&termo=')
      .then((response) => setEmpresas(response.content))
      .catch((exception) => setErro(exception as ApiError));
  }, []);

  const carregar = useCallback(() => {
    setCarregando(true);
    setErro(undefined);
    const query = empresaId ? `?empresaId=${empresaId}` : '';
    void api<Certidao[]>(`/certidoes${query}`)
      .then((itens) => {
        setCertidoes(itens);
        const idsAtuais = new Set(itens.map((item) => item.id));
        setSelecionadas((atuais) => new Set([...atuais].filter((id) => idsAtuais.has(id))));
      })
      .catch((exception) => setErro(exception as ApiError))
      .finally(() => setCarregando(false));
  }, [empresaId]);

  useEffect(carregar, [carregar]);

  const selecionarEmpresa = (value: string) => {
    setEmpresaId(value);
    setSelecionadas(new Set());
    if (value) setSearchParams({ empresaId: value });
    else setSearchParams({});
  };

  const filtradas = useMemo(() => certidoes.filter((item) =>
    (!filtroTipo || item.tipo === filtroTipo)
    && (!filtroStatus || item.status === filtroStatus)), [certidoes, filtroStatus, filtroTipo]);

  const solicitar = async (item: Certidao) => {
    setSolicitando((atual) => new Set(atual).add(item.id));
    setErro(undefined);
    try {
      const atualizada = await api<Certidao>(`/certidoes/${item.id}/solicitar`, { method: 'POST' });
      substituir(atualizada);
      setMensagem(t('certidoes.mensagens.solicitada'));
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setSolicitando((atual) => {
        const proximo = new Set(atual);
        proximo.delete(item.id);
        return proximo;
      });
    }
  };

  const solicitarTodas = async () => {
    if (!empresaId) return;
    setCarregando(true);
    try {
      await api<Certidao[]>(`/certidoes/solicitar-todas?empresaId=${empresaId}`, { method: 'POST' });
      setMensagem(t('certidoes.mensagens.todasSolicitadas'));
      carregar();
    } catch (exception) {
      setErro(exception as ApiError);
      setCarregando(false);
    }
  };

  const solicitarSelecionadas = async () => {
    if (selecionadas.size === 0) return;
    setSolicitandoLote(true);
    setErro(undefined);
    setAviso('');
    try {
      const resultado = await api<SolicitacaoLoteResponse>('/certidoes/solicitar-lote', {
        method: 'POST',
        body: JSON.stringify({
          ids: [...selecionadas],
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      setSelecionadas(new Set());
      if (resultado.rejeitadas > 0) {
        setAviso(t('certidoes.lote.resultadoParcial', {
          aceitas: resultado.aceitas,
          rejeitadas: resultado.rejeitadas,
        }));
      } else {
        setMensagem(t('certidoes.lote.resultadoSucesso', { quantidade: resultado.aceitas }));
      }
      carregar();
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setSolicitandoLote(false);
    }
  };

  const alternarSelecao = (id: string) => {
    setSelecionadas((atuais) => {
      const proximo = new Set(atuais);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  };

  const selecionarFiltradas = () => {
    setSelecionadas((atuais) => {
      const proximo = new Set(atuais);
      filtradas.forEach((item) => proximo.add(item.id));
      return proximo;
    });
  };

  const substituir = (atualizada: Certidao) => {
    setCertidoes((atuais) => atuais.map((item) => item.id === atualizada.id ? atualizada : item));
  };

  const baixar = async (item: Certidao) => {
    if (!item.documentoId) return;
    try {
      const download = await baixarArquivo(`/documentos/${item.documentoId}/conteudo`);
      const url = URL.createObjectURL(download.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = download.nome ?? `certidao-${item.tipo}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (exception) {
      setErro(exception as ApiError);
    }
  };

  const exportarCsv = async () => {
    setExportando(true);
    setErro(undefined);
    try {
      const params = new URLSearchParams();
      if (empresaId) params.set('empresaId', empresaId);
      if (filtroTipo) params.set('tipo', filtroTipo);
      if (filtroStatus) params.set('status', filtroStatus);
      const query = params.toString();
      const download = await baixarArquivo(`/certidoes/exportacao.csv${query ? `?${query}` : ''}`);
      const url = URL.createObjectURL(download.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = download.nome ?? 'certidoes.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMensagem(t('certidoes.mensagens.exportacaoGerada'));
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setExportando(false);
    }
  };

  return (
    <>
      <PageHeader
        titulo={t('certidoes.titulo')}
        descricao={t('certidoes.descricao')}
        acoes={
          <>
            <Button variante="secundario" onClick={() => navigate('/certidoes/agenda')}>
              {t('certidoes.agenda.acao')}
            </Button>
            {podeSolicitar ? (
              <Button
                onClick={() => void solicitarSelecionadas()}
                disabled={selecionadas.size === 0 || solicitandoLote}
              >
                {t('certidoes.lote.solicitarSelecionadas', { quantidade: selecionadas.size })}
              </Button>
            ) : null}
            <Button variante="secundario" onClick={() => void exportarCsv()} disabled={exportando}>
              {t('certidoes.acoes.exportarCsv')}
            </Button>
            <Button variante="secundario" onClick={carregar}>{t('acoes.atualizar')}</Button>
            {empresaId && podeSolicitar ? (
              <Button onClick={() => void solicitarTodas()} disabled={carregando}>
                {t('certidoes.acoes.atualizarTodas')}
              </Button>
            ) : null}
          </>
        }
      />
      {mensagem ? <Alert tipo="sucesso" onClose={() => setMensagem('')}>{mensagem}</Alert> : null}
      {aviso ? <Alert tipo="aviso" onClose={() => setAviso('')}>{aviso}</Alert> : null}
      {erro ? (
        <Alert tipo="erro" onClose={() => setErro(undefined)}>
          <strong>{erro.mensagem ?? t('erros.inesperado')}</strong>
          {erro.correlationId ? <small>{t('erros.correlationId', { valor: erro.correlationId })}</small> : null}
        </Alert>
      ) : null}

      <Card className="filters-card">
        <div className="filter-grid">
          <label className="field">
            <span>{t('documentos.selecionarEmpresa')}</span>
            <select value={empresaId} onChange={(event) => selecionarEmpresa(event.target.value)}>
              <option value="">{t('certidoes.todasEmpresas')}</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>{empresa.razaoSocial}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t('certidoes.campos.tipo')}</span>
            <select value={filtroTipo} onChange={(event) => setFiltroTipo(event.target.value as TipoCertidao | '')}>
              <option value="">{t('certidoes.filtros.todosTipos')}</option>
              {tipos.map((tipo) => <option key={tipo} value={tipo}>{t(`certidoes.tipos.${tipo}`)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{t('comum.status')}</span>
            <select value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value as StatusCertidao | '')}>
              <option value="">{t('certidoes.filtros.todosStatus')}</option>
              {statusDisponiveis.map((status) => <option key={status} value={status}>{t(`certidoes.status.${status}`)}</option>)}
            </select>
          </label>
        </div>
        {podeSolicitar ? (
          <div className="section-toolbar">
            <small className="muted">
              {t('certidoes.lote.selecionadas', { quantidade: selecionadas.size })}
            </small>
            <div className="form-actions">
              <Button type="button" variante="texto" onClick={selecionarFiltradas} disabled={filtradas.length === 0}>
                {t('certidoes.lote.selecionarFiltradas', { quantidade: filtradas.length })}
              </Button>
              <Button type="button" variante="texto" onClick={() => setSelecionadas(new Set())} disabled={selecionadas.size === 0}>
                {t('certidoes.lote.limparSelecao')}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {carregando && certidoes.length === 0 ? <p className="muted">{t('app.carregando')}</p> : null}
      {!carregando && filtradas.length === 0 ? (
        <EmptyState
          titulo={t('certidoes.listaVazia')}
          descricao={empresaId ? t('certidoes.listaVaziaEmpresa') : t('certidoes.listaVaziaGeral')}
        />
      ) : (
        <div className="certificate-grid">
          {filtradas.map((item) => (
            <Card key={item.id} className="certificate-card">
              <div className="certificate-card__header">
                <div>
                  {podeSolicitar ? (
                    <label className="certificate-card__selection">
                      <input
                        type="checkbox"
                        checked={selecionadas.has(item.id)}
                        onChange={() => alternarSelecao(item.id)}
                        aria-label={t('certidoes.lote.selecionarItem', { tipo: t(`certidoes.tipos.${item.tipo}`) })}
                      />
                      <span className="eyebrow">{formatarCnpj(item.cnpj)}</span>
                    </label>
                  ) : (
                    <span className="eyebrow">{formatarCnpj(item.cnpj)}</span>
                  )}
                  <h2>{t(`certidoes.tipos.${item.tipo}`)}</h2>
                </div>
                <StatusBadge tom={tomStatus(item.status)}>{t(`certidoes.status.${item.status}`)}</StatusBadge>
              </div>
              <dl className="definition-list definition-list--compact">
                <div><dt>{t('certidoes.campos.numero')}</dt><dd>{item.numeroCertidao ?? t('comum.naoInformado')}</dd></div>
                <div><dt>{t('certidoes.campos.emitidaEm')}</dt><dd>{item.emitidaEm ? formatarData(item.emitidaEm) : t('comum.naoInformado')}</dd></div>
                <div><dt>{t('certidoes.campos.validaAte')}</dt><dd>{item.validaAte ? formatarData(item.validaAte) : t('comum.naoInformado')}</dd></div>
                <div><dt>{t('certidoes.campos.provedor')}</dt><dd>{item.ultimoProvedorCodigo ?? t('comum.naoInformado')}</dd></div>
                <div><dt>{t('certidoes.campos.observadaEm')}</dt><dd>{item.observadaEm ? formatarDataHora(item.observadaEm) : t('comum.naoInformado')}</dd></div>
              </dl>
              {item.mensagemFonte ? <p className="certificate-card__message">{item.mensagemFonte}</p> : null}
              <div className="certificate-card__actions">
                {podeSolicitar ? (
                  <Button variante="secundario" disabled={solicitando.has(item.id)} onClick={() => void solicitar(item)}>
                    {t('certidoes.acoes.solicitar')}
                  </Button>
                ) : null}
                {temPermissao(PERMISSOES.CERTIDAO_REGISTRAR_MANUAL) ? (
                  <Button variante="texto" onClick={() => setManual(item)}>{t('certidoes.acoes.registrarManual')}</Button>
                ) : null}
                <Button variante="texto" onClick={() => setHistorico(item)}>{t('certidoes.acoes.historico')}</Button>
                {item.documentoId && temPermissao(PERMISSOES.DOCUMENTO_BAIXAR) ? (
                  <Button variante="texto" onClick={() => void baixar(item)}>{t('acoes.baixar')}</Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <CertidaoManualModal
        aberto={Boolean(manual)}
        certidao={manual}
        aoFechar={() => setManual(undefined)}
        aoSalvar={(salva) => {
          substituir(salva);
          setManual(undefined);
          setMensagem(t('certidoes.mensagens.manualRegistrada'));
        }}
      />
      <CertidaoHistoryModal aberto={Boolean(historico)} certidao={historico} aoFechar={() => setHistorico(undefined)} />
    </>
  );
}

const statusDisponiveis: StatusCertidao[] = [
  'NAO_CONSULTADA', 'AGENDADA', 'EM_PROCESSAMENTO', 'REGULAR',
  'POSITIVA_COM_EFEITO_NEGATIVA', 'IRREGULAR', 'INCOMPLETA',
  'FONTE_INDISPONIVEL', 'ACAO_MANUAL_NECESSARIA',
  'PROXIMA_DO_VENCIMENTO', 'VENCIDA', 'FALHA',
];

function tomStatus(status: StatusCertidao): 'sucesso' | 'aviso' | 'erro' | 'info' | 'neutro' {
  if (status === 'REGULAR') return 'sucesso';
  if (['IRREGULAR', 'VENCIDA', 'FALHA'].includes(status)) return 'erro';
  if (['POSITIVA_COM_EFEITO_NEGATIVA', 'INCOMPLETA', 'FONTE_INDISPONIVEL', 'ACAO_MANUAL_NECESSARIA', 'PROXIMA_DO_VENCIMENTO'].includes(status)) return 'aviso';
  if (['AGENDADA', 'EM_PROCESSAMENTO'].includes(status)) return 'info';
  return 'neutro';
}

function formatarCnpj(cnpj: string) {
  return cnpj.length === 14
    ? cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    : cnpj;
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`));
}

function formatarDataHora(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
