import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../api/http';
import type { Intervencao, Pagina } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

export function IntervencoesPage() {
  const { t, i18n } = useTranslation();
  const { temPermissao } = useAuth();
  const [itens, setItens] = useState<Intervencao[]>([]);
  const [erro, setErro] = useState<ApiError>();
  const [mensagem, setMensagem] = useState('');

  const carregar = useCallback(() => {
    void api<Pagina<Intervencao>>('/intervencoes?pagina=0&tamanho=100')
      .then((response) => setItens(response.content))
      .catch((exception) => setErro(exception as ApiError));
  }, []);

  useEffect(carregar, [carregar]);

  const textoKey = (key: string) => i18n.exists(key) ? t(key) : key;

  const resolver = async (item: Intervencao) => {
    try {
      await api<void>(`/intervencoes/${item.id}/resolver`, { method: 'PATCH' });
      setMensagem(t('intervencoes.mensagemResolvida'));
      carregar();
    } catch (exception) {
      setErro(exception as ApiError);
    }
  };

  return (
    <>
      <PageHeader titulo={t('intervencoes.titulo')} descricao={t('intervencoes.descricao')} />
      {mensagem ? <Alert tipo="sucesso" onClose={() => setMensagem('')}>{mensagem}</Alert> : null}
      {erro ? <Alert tipo="erro" onClose={() => setErro(undefined)}>{erro.mensagem ?? t('erros.inesperado')}</Alert> : null}
      {itens.length === 0 ? (
        <EmptyState titulo={t('intervencoes.listaVazia')} />
      ) : (
        <div className="card-list">
          {itens.map((item) => (
            <Card key={item.id}>
              <div className="card-row">
                <div>
                  <div className="card-row__title">
                    <strong>{textoKey(item.tituloKey)}</strong>
                    <StatusBadge tom="aviso">{t(`intervencoes.tipos.${item.tipo}`)}</StatusBadge>
                  </div>
                  <p>{textoKey(item.instrucaoKey)}</p>
                  <small>{formatarData(item.criadoEm)}</small>
                </div>
                {temPermissao(PERMISSOES.INTERVENCAO_RESOLVER) ? (
                  <Button onClick={() => void resolver(item)}>{t('acoes.resolver')}</Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
