import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../api/http';
import type { Execucao, Pagina, StatusExecucao } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

export function ExecucoesPage() {
  const { t } = useTranslation();
  const { temPermissao } = useAuth();
  const [execucoes, setExecucoes] = useState<Execucao[]>([]);
  const [erro, setErro] = useState<ApiError>();
  const [mensagem, setMensagem] = useState('');
  const [filtro, setFiltro] = useState<StatusExecucao | ''>('');

  const carregar = useCallback(() => {
    setErro(undefined);
    void api<Pagina<Execucao>>('/execucoes?pagina=0&tamanho=100')
      .then((response) => setExecucoes(response.content))
      .catch((exception) => setErro(exception as ApiError));
  }, []);

  useEffect(carregar, [carregar]);

  const cancelar = async (execucao: Execucao) => {
    try {
      await api<void>(`/execucoes/${execucao.id}/cancelar?motivo=${encodeURIComponent(t('execucoes.cancelamentoUsuario'))}`, { method: 'PATCH' });
      setMensagem(t('execucoes.mensagemCancelada'));
      carregar();
    } catch (exception) {
      setErro(exception as ApiError);
    }
  };

  const visiveis = filtro ? execucoes.filter((item) => item.status === filtro) : execucoes;

  return (
    <>
      <PageHeader
        titulo={t('execucoes.titulo')}
        descricao={t('execucoes.descricao')}
        acoes={<Button variante="secundario" onClick={carregar}>{t('acoes.atualizar')}</Button>}
      />
      {mensagem ? <Alert tipo="sucesso" onClose={() => setMensagem('')}>{mensagem}</Alert> : null}
      {erro ? <Alert tipo="erro" onClose={() => setErro(undefined)}>{erro.mensagem ?? t('erros.inesperado')}</Alert> : null}
      <div className="filter-bar">
        <label className="field execution-filter">
          <span>{t('comum.status')}</span>
          <select value={filtro} onChange={(event) => setFiltro(event.target.value as StatusExecucao | '')}>
            <option value="">{t('execucoes.todosStatus')}</option>
            {statuses.map((status) => <option key={status} value={status}>{t(`execucoes.status.${status}`)}</option>)}
          </select>
        </label>
      </div>
      {visiveis.length === 0 ? (
        <EmptyState titulo={t('execucoes.listaVazia')} />
      ) : (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('execucoes.operacao')}</th>
                  <th>{t('execucoes.provedor')}</th>
                  <th>{t('comum.status')}</th>
                  <th>{t('execucoes.tentativas')}</th>
                  <th>{t('execucoes.worker')}</th>
                  <th>{t('comum.data')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visiveis.map((execucao) => (
                  <tr key={execucao.id}>
                    <td>
                      <strong>{t(`integracoes.operacoes.${execucao.operacao}`, { defaultValue: execucao.operacao })}</strong>
                      {execucao.erroResumo ? <span className="table-secondary table-secondary--error">{execucao.erroCodigo ? `${execucao.erroCodigo}: ` : ''}{execucao.erroResumo}</span> : null}
                      {execucao.protocoloExterno ? <span className="table-secondary">{t('execucoes.protocolo')}: {execucao.protocoloExterno}</span> : null}
                    </td>
                    <td>{execucao.provedorCodigo ?? t('comum.naoInformado')}</td>
                    <td><StatusBadge tom={tomExecucao(execucao.status)}>{t(`execucoes.status.${execucao.status}`)}</StatusBadge></td>
                    <td>{execucao.tentativas} / {execucao.maxTentativas}</td>
                    <td>{execucao.workerId ?? t('comum.naoInformado')}</td>
                    <td>
                      {formatarData(execucao.criadoEm)}
                      {execucao.proximaTentativaEm ? <span className="table-secondary">{t('execucoes.proximaTentativa')}: {formatarData(execucao.proximaTentativaEm)}</span> : null}
                    </td>
                    <td className="table-actions">
                      {temPermissao(PERMISSOES.EXECUCAO_CANCELAR) && podeCancelar(execucao.status) ? (
                        <Button variante="texto" onClick={() => void cancelar(execucao)}>{t('acoes.cancelar')}</Button>
                      ) : null}
                    </td>
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

const statuses: StatusExecucao[] = [
  'NA_FILA', 'EXECUTANDO', 'RETRY_AGENDADO', 'AGUARDANDO_HUMANO',
  'AGUARDANDO_CAPTCHA', 'AGUARDANDO_AUTENTICACAO', 'SUCESSO',
  'PARCIAL', 'FALHA', 'FONTE_INDISPONIVEL', 'CANCELADO',
];

function podeCancelar(status: StatusExecucao) {
  return !['SUCESSO', 'FALHA', 'FONTE_INDISPONIVEL', 'CANCELADO'].includes(status);
}

function tomExecucao(status: StatusExecucao): 'sucesso' | 'aviso' | 'erro' | 'info' | 'neutro' {
  if (status === 'SUCESSO') return 'sucesso';
  if (['FALHA', 'FONTE_INDISPONIVEL'].includes(status)) return 'erro';
  if (status.startsWith('AGUARDANDO') || status === 'RETRY_AGENDADO') return 'aviso';
  if (status === 'EXECUTANDO') return 'info';
  return 'neutro';
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
