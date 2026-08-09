import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/http';
import type { Execucao, Pagina } from '../api/types';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

export function ExecucoesPage() {
  const { t } = useTranslation();
  const [execucoes, setExecucoes] = useState<Execucao[]>([]);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    void api<Pagina<Execucao>>('/execucoes?pagina=0&tamanho=100')
      .then((response) => setExecucoes(response.content))
      .catch(() => setErro(true));
  }, []);

  return (
    <>
      <PageHeader titulo={t('execucoes.titulo')} descricao={t('execucoes.descricao')} />
      {erro ? <Alert tipo="erro">{t('comum.erroCarregamento')}</Alert> : null}
      {execucoes.length === 0 ? (
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
                  <th>{t('comum.data')}</th>
                </tr>
              </thead>
              <tbody>
                {execucoes.map((execucao) => (
                  <tr key={execucao.id}>
                    <td>
                      <strong>{execucao.operacao}</strong>
                      {execucao.erroResumo ? <span className="table-secondary">{execucao.erroResumo}</span> : null}
                    </td>
                    <td>{execucao.provedorCodigo ?? t('comum.naoInformado')}</td>
                    <td>
                      <StatusBadge tom={tomExecucao(execucao.status)}>
                        {t(`execucoes.status.${execucao.status}`)}
                      </StatusBadge>
                    </td>
                    <td>{execucao.tentativas} / {execucao.maxTentativas}</td>
                    <td>{formatarData(execucao.criadoEm)}</td>
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

function tomExecucao(status: string): 'sucesso' | 'aviso' | 'erro' | 'info' | 'neutro' {
  if (status === 'SUCESSO') return 'sucesso';
  if (['FALHA', 'FONTE_INDISPONIVEL'].includes(status)) return 'erro';
  if (status.startsWith('AGUARDANDO') || status === 'RETRY_AGENDADO') return 'aviso';
  if (status === 'EXECUTANDO') return 'info';
  return 'neutro';
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
