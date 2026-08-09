import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api, type ApiError } from '../api/http';
import type { Notificacao, Pagina } from '../api/types';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

export function NotificacoesPage() {
  const { t, i18n } = useTranslation();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [erro, setErro] = useState<ApiError>();

  const carregar = useCallback(() => {
    void api<Pagina<Notificacao>>('/notificacoes?pagina=0&tamanho=100')
      .then((response) => setNotificacoes(response.content))
      .catch((exception) => setErro(exception as ApiError));
  }, []);

  useEffect(carregar, [carregar]);

  const textoKey = (key: string) => i18n.exists(key) ? t(key) : key;

  const marcarLida = async (id: string) => {
    try {
      await api<void>(`/notificacoes/${id}/lida`, { method: 'PATCH' });
      carregar();
    } catch (exception) {
      setErro(exception as ApiError);
    }
  };

  return (
    <>
      <PageHeader titulo={t('notificacoes.titulo')} descricao={t('notificacoes.descricao')} />
      {erro ? <Alert tipo="erro" onClose={() => setErro(undefined)}>{erro.mensagem ?? t('erros.inesperado')}</Alert> : null}
      {notificacoes.length === 0 ? (
        <EmptyState titulo={t('notificacoes.listaVazia')} />
      ) : (
        <div className="card-list">
          {notificacoes.map((notificacao) => (
            <Card key={notificacao.id} className={notificacao.lida ? 'notification notification--read' : 'notification'}>
              <div className="card-row">
                <div>
                  <div className="card-row__title">
                    <strong>{textoKey(notificacao.tituloKey)}</strong>
                    <StatusBadge tom={tom(notificacao.tipo)}>{t(`notificacoes.tipos.${notificacao.tipo}`)}</StatusBadge>
                  </div>
                  <p>{textoKey(notificacao.mensagemKey)}</p>
                  <small>{formatarData(notificacao.criadoEm)}</small>
                </div>
                <div className="card-row__actions">
                  {notificacao.deepLink ? (
                    <Link className="button button--secundario" to={notificacao.deepLink}>{t('acoes.abrir')}</Link>
                  ) : null}
                  {!notificacao.lida ? (
                    <Button variante="texto" onClick={() => void marcarLida(notificacao.id)}>{t('acoes.marcarLida')}</Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function tom(tipo: string): 'sucesso' | 'aviso' | 'erro' | 'info' | 'neutro' {
  if (tipo === 'ERRO') return 'erro';
  if (tipo === 'AVISO' || tipo === 'ACAO_NECESSARIA') return 'aviso';
  return 'info';
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
