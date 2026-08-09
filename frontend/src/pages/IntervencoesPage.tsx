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
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { InteractiveSessionModal } from '../features/intervencoes/InteractiveSessionModal';

export function IntervencoesPage() {
  const { t, i18n } = useTranslation();
  const { temPermissao, usuario } = useAuth();
  const [itens, setItens] = useState<Intervencao[]>([]);
  const [erro, setErro] = useState<ApiError>();
  const [mensagem, setMensagem] = useState('');
  const [resolucao, setResolucao] = useState<Intervencao>();
  const [sessao, setSessao] = useState<Intervencao>();
  const [observacao, setObservacao] = useState('');
  const [retomar, setRetomar] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    setErro(undefined);
    void api<Pagina<Intervencao>>('/intervencoes?pagina=0&tamanho=100')
      .then((response) => setItens(response.content))
      .catch((exception) => setErro(exception as ApiError));
  }, []);

  useEffect(carregar, [carregar]);

  const textoKey = (key: string) => i18n.exists(key) ? t(key) : key;

  const assumir = async (item: Intervencao): Promise<Intervencao> => {
    if (item.status === 'EM_ATENDIMENTO' && item.atribuidaPara === usuario?.usuario) {
      return item;
    }
    const atualizada = await api<Intervencao>(`/intervencoes/${item.id}/assumir`, {
      method: 'PATCH',
    });
    setItens((atuais) =>
      atuais.map((atual) => atual.id === atualizada.id ? atualizada : atual),
    );
    return atualizada;
  };

  const assumirSemAbrir = async (item: Intervencao) => {
    try {
      await assumir(item);
      setMensagem(t('intervencoes.mensagemAssumida'));
    } catch (exception) {
      setErro(exception as ApiError);
    }
  };

  const abrirSessao = async (item: Intervencao) => {
    try {
      const atribuida = await assumir(item);
      setSessao(atribuida);
    } catch (exception) {
      setErro(exception as ApiError);
    }
  };

  const abrirResolucao = (item: Intervencao) => {
    setResolucao(item);
    setObservacao('');
    setRetomar(item.tipo !== 'OUTRA');
  };

  const resolver = async () => {
    if (!resolucao) return;
    setSalvando(true);
    try {
      await api<Intervencao>(`/intervencoes/${resolucao.id}/resolver`, {
        method: 'PATCH',
        body: JSON.stringify({
          observacao: observacao.trim() || null,
          retomarExecucao: retomar,
        }),
      });
      setResolucao(undefined);
      setMensagem(t('intervencoes.mensagemResolvida'));
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
        titulo={t('intervencoes.titulo')}
        descricao={t('intervencoes.descricao')}
        acoes={
          <Button variante="secundario" onClick={carregar}>
            {t('acoes.atualizar')}
          </Button>
        }
      />
      {mensagem ? (
        <Alert tipo="sucesso" onClose={() => setMensagem('')}>
          {mensagem}
        </Alert>
      ) : null}
      {erro ? (
        <Alert tipo="erro" onClose={() => setErro(undefined)}>
          {erro.mensagem ?? t('erros.inesperado')}
        </Alert>
      ) : null}
      {itens.length === 0 ? (
        <EmptyState titulo={t('intervencoes.listaVazia')} />
      ) : (
        <div className="card-list">
          {itens.map((item) => {
            const atribuidaAoAtual = Boolean(
              item.atribuidaPara && item.atribuidaPara === usuario?.usuario,
            );
            const podeAtender = temPermissao(PERMISSOES.INTERVENCAO_RESOLVER)
              && (item.status === 'PENDENTE' || item.status === 'EM_ATENDIMENTO');
            const ocupadaPorOutro = item.status === 'EM_ATENDIMENTO'
              && Boolean(item.atribuidaPara)
              && !atribuidaAoAtual;

            return (
              <Card key={item.id}>
                <div className="card-row">
                  <div>
                    <div className="card-row__title">
                      <strong>{textoKey(item.tituloKey)}</strong>
                      <StatusBadge tom="aviso">
                        {t(`intervencoes.tipos.${item.tipo}`)}
                      </StatusBadge>
                      <StatusBadge tom={item.status === 'EM_ATENDIMENTO' ? 'info' : 'neutro'}>
                        {t(`intervencoes.status.${item.status}`)}
                      </StatusBadge>
                    </div>
                    <p>{textoKey(item.instrucaoKey)}</p>
                    <div className="metadata-line">
                      <span>
                        {t('intervencoes.criadaEm')}: {formatarData(item.criadoEm)}
                      </span>
                      {item.expiraEm ? (
                        <span>
                          {t('intervencoes.expiraEm')}: {formatarData(item.expiraEm)}
                        </span>
                      ) : null}
                      {item.atribuidaPara ? (
                        <span>
                          {t('intervencoes.atribuidaPara')}: {item.atribuidaPara}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {podeAtender && !ocupadaPorOutro ? (
                    <div className="card-row__actions">
                      {item.sessaoReferencia ? (
                        <Button onClick={() => void abrirSessao(item)}>
                          {t('intervencoes.sessao.resolverAgora')}
                        </Button>
                      ) : (
                        <>
                          {item.status === 'PENDENTE' ? (
                            <Button
                              variante="secundario"
                              onClick={() => void assumirSemAbrir(item)}
                            >
                              {t('intervencoes.assumir')}
                            </Button>
                          ) : null}
                          {(atribuidaAoAtual
                            || item.status === 'PENDENTE'
                            || !item.atribuidaPara) ? (
                            <Button onClick={() => abrirResolucao(item)}>
                              {t('acoes.resolver')}
                            </Button>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        aberto={Boolean(resolucao)}
        titulo={t('intervencoes.resolucaoTitulo')}
        aoFechar={() => setResolucao(undefined)}
        rodape={
          <>
            <Button variante="secundario" onClick={() => setResolucao(undefined)}>
              {t('acoes.cancelar')}
            </Button>
            <Button disabled={salvando} onClick={() => void resolver()}>
              {t('acoes.confirmar')}
            </Button>
          </>
        }
      >
        <Alert tipo="aviso">{t('intervencoes.resolverConfirmacao')}</Alert>
        <div className="form-grid">
          <label className="field field--wide">
            <span>{t('intervencoes.observacao')}</span>
            <textarea
              rows={4}
              maxLength={500}
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
            />
          </label>
          <label className="field checkbox-field field--wide">
            <input
              type="checkbox"
              checked={retomar}
              onChange={(event) => setRetomar(event.target.checked)}
            />
            <span>{t('intervencoes.retomarExecucao')}</span>
          </label>
        </div>
      </Modal>

      <InteractiveSessionModal
        aberto={Boolean(sessao)}
        intervencao={sessao}
        aoFechar={() => setSessao(undefined)}
        aoContinuar={() => {
          setSessao(undefined);
          setMensagem(t('intervencoes.sessao.automacaoRetomada'));
          window.setTimeout(carregar, 1_500);
        }}
      />
    </>
  );
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
