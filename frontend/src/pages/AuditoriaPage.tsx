import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { api, baixarArquivo, type ApiError } from '../api/http';
import type { EventoAuditoria, Pagina } from '../api/types';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import '../styles/auditoria.css';

type Filtros = {
  acao: string;
  recursoTipo: string;
  ator: string;
  inicio: string;
  fim: string;
};

const filtrosVazios: Filtros = {
  acao: '',
  recursoTipo: '',
  ator: '',
  inicio: '',
  fim: '',
};

export function AuditoriaPage() {
  const { t } = useTranslation();
  const [pagina, setPagina] = useState(0);
  const [filtros, setFiltros] = useState<Filtros>({ ...filtrosVazios });
  const [consulta, setConsulta] = useState<Filtros>({ ...filtrosVazios });
  const [dados, setDados] = useState<Pagina<EventoAuditoria>>();
  const [erro, setErro] = useState<ApiError>();
  const [exportando, setExportando] = useState(false);

  const carregar = useCallback(() => {
    setErro(undefined);
    void api<Pagina<EventoAuditoria>>(`/auditoria?pagina=${pagina}&tamanho=50&${parametros(consulta)}`)
      .then(setDados)
      .catch((exception) => setErro(exception as ApiError));
  }, [consulta, pagina]);

  useEffect(carregar, [carregar]);

  const aplicarFiltros = (event: FormEvent) => {
    event.preventDefault();
    setPagina(0);
    setConsulta({ ...filtros });
  };

  const limparFiltros = () => {
    setFiltros({ ...filtrosVazios });
    setConsulta({ ...filtrosVazios });
    setPagina(0);
  };

  const exportar = async () => {
    setExportando(true);
    setErro(undefined);
    try {
      const download = await baixarArquivo(`/auditoria/exportacao.csv?${parametros(consulta)}`);
      const url = URL.createObjectURL(download.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = download.nome ?? 'auditoria.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setExportando(false);
    }
  };

  const eventos = dados?.content ?? [];

  return (
    <>
      <PageHeader
        titulo={t('auditoria.titulo')}
        descricao={t('auditoria.descricao')}
        acoes={
          <Button variante="secundario" disabled={exportando} onClick={() => void exportar()}>
            {t('auditoria.exportacao.acao')}
          </Button>
        }
      />
      {erro ? (
        <Alert tipo="erro" onClose={() => setErro(undefined)}>
          <strong>{erro.mensagem ?? t('comum.erroCarregamento')}</strong>
          {erro.correlationId ? (
            <small>{t('erros.correlationId', { valor: erro.correlationId })}</small>
          ) : null}
        </Alert>
      ) : null}

      <form className="card audit-filter-card" onSubmit={aplicarFiltros}>
        <label className="field">
          <span>{t('auditoria.exportacao.acaoFiltro')}</span>
          <input
            value={filtros.acao}
            maxLength={100}
            onChange={(event) => setFiltros((atual) => ({ ...atual, acao: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>{t('auditoria.exportacao.recursoFiltro')}</span>
          <input
            value={filtros.recursoTipo}
            maxLength={100}
            onChange={(event) => setFiltros((atual) => ({ ...atual, recursoTipo: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>{t('auditoria.exportacao.atorFiltro')}</span>
          <input
            value={filtros.ator}
            maxLength={200}
            onChange={(event) => setFiltros((atual) => ({ ...atual, ator: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>{t('auditoria.exportacao.inicio')}</span>
          <input
            type="date"
            value={filtros.inicio}
            onChange={(event) => setFiltros((atual) => ({ ...atual, inicio: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>{t('auditoria.exportacao.fim')}</span>
          <input
            type="date"
            value={filtros.fim}
            onChange={(event) => setFiltros((atual) => ({ ...atual, fim: event.target.value }))}
          />
        </label>
        <div className="audit-filter-card__actions">
          <Button type="submit" variante="secundario">{t('auditoria.exportacao.filtrar')}</Button>
          <Button type="button" variante="texto" onClick={limparFiltros}>
            {t('auditoria.exportacao.limpar')}
          </Button>
        </div>
      </form>

      <div className="audit-summary">
        <span>{t('auditoria.exportacao.total', { quantidade: dados?.totalElements ?? 0 })}</span>
        <span>{t('auditoria.exportacao.descricaoSegura')}</span>
      </div>

      {eventos.length === 0 ? (
        <EmptyState titulo={t('auditoria.listaVazia')} />
      ) : (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('comum.data')}</th>
                  <th>{t('auditoria.acao')}</th>
                  <th>{t('auditoria.recurso')}</th>
                  <th>{t('auditoria.ator')}</th>
                  <th>{t('auditoria.correlationId')}</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => (
                  <tr key={evento.id}>
                    <td>{formatarData(evento.criadoEm)}</td>
                    <td>{evento.acao}</td>
                    <td>{evento.recursoTipo}{evento.recursoId ? ` · ${evento.recursoId}` : ''}</td>
                    <td>{evento.ator}</td>
                    <td><code>{evento.correlationId ?? t('comum.naoInformado')}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagina={pagina} totalPaginas={dados?.totalPages ?? 0} aoMudar={setPagina} />
        </div>
      )}
    </>
  );
}

function parametros(filtros: Filtros) {
  const query = new URLSearchParams();
  if (filtros.acao.trim()) query.set('acao', filtros.acao.trim());
  if (filtros.recursoTipo.trim()) query.set('recursoTipo', filtros.recursoTipo.trim());
  if (filtros.ator.trim()) query.set('ator', filtros.ator.trim());
  if (filtros.inicio) query.set('inicio', filtros.inicio);
  if (filtros.fim) query.set('fim', filtros.fim);
  return query.toString();
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
