import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../api/http';
import type { Provedor } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

export function IntegracoesPage() {
  const { t } = useTranslation();
  const { temPermissao } = useAuth();
  const [provedores, setProvedores] = useState<Provedor[]>([]);
  const [erro, setErro] = useState<ApiError>();
  const [mensagem, setMensagem] = useState('');

  const carregar = useCallback(() => {
    void api<Provedor[]>('/integracoes/provedores')
      .then(setProvedores)
      .catch((exception) => setErro(exception as ApiError));
  }, []);

  useEffect(carregar, [carregar]);

  const alterar = (codigo: string, campo: keyof Provedor, valor: string | number | boolean) => {
    setProvedores((atuais) =>
      atuais.map((item) => item.codigo === codigo ? ({ ...item, [campo]: valor } as Provedor) : item),
    );
  };

  const salvar = async (provedor: Provedor) => {
    try {
      const atualizado = await api<Provedor>(`/integracoes/provedores/${provedor.codigo}`, {
        method: 'PUT',
        body: JSON.stringify({
          habilitado: provedor.habilitado,
          prioridade: Number(provedor.prioridade),
          timeoutSegundos: Number(provedor.timeoutSegundos),
          maxRetries: Number(provedor.maxRetries),
          baseUrl: provedor.baseUrl || null,
          referenciaSegredo: provedor.referenciaSegredo || null,
        }),
      });
      setProvedores((atuais) => atuais.map((item) => item.codigo === atualizado.codigo ? atualizado : item));
      setMensagem(t('integracoes.mensagemAtualizada'));
    } catch (exception) {
      setErro(exception as ApiError);
    }
  };

  return (
    <>
      <PageHeader titulo={t('integracoes.titulo')} descricao={t('integracoes.descricao')} />
      {mensagem ? <Alert tipo="sucesso" onClose={() => setMensagem('')}>{mensagem}</Alert> : null}
      {erro ? <Alert tipo="erro" onClose={() => setErro(undefined)}>{erro.mensagem ?? t('erros.inesperado')}</Alert> : null}
      {provedores.length === 0 ? (
        <EmptyState titulo={t('integracoes.listaVazia')} />
      ) : (
        <div className="integration-grid">
          {provedores.map((provedor) => (
            <Card key={provedor.codigo}>
              <div className="card-row__title">
                <strong>{provedor.nome}</strong>
                <StatusBadge tom={provedor.habilitado ? 'sucesso' : 'neutro'}>
                  {provedor.habilitado ? t('comum.sim') : t('comum.nao')}
                </StatusBadge>
              </div>
              <p className="muted">{t(`integracoes.tipos.${provedor.tipo}`)}</p>
              <div className="form-grid form-grid--compact">
                <label className="field checkbox-field">
                  <input
                    type="checkbox"
                    checked={provedor.habilitado}
                    disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR)}
                    onChange={(event) => alterar(provedor.codigo, 'habilitado', event.target.checked)}
                  />
                  <span>{t('integracoes.habilitado')}</span>
                </label>
                <label className="field">
                  <span>{t('integracoes.prioridade')}</span>
                  <input type="number" min={0} max={1000} value={provedor.prioridade} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR)} onChange={(event) => alterar(provedor.codigo, 'prioridade', Number(event.target.value))} />
                </label>
                <label className="field">
                  <span>{t('integracoes.timeout')}</span>
                  <input type="number" min={1} max={3600} value={provedor.timeoutSegundos} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR)} onChange={(event) => alterar(provedor.codigo, 'timeoutSegundos', Number(event.target.value))} />
                </label>
                <label className="field">
                  <span>{t('integracoes.retries')}</span>
                  <input type="number" min={0} max={10} value={provedor.maxRetries} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR)} onChange={(event) => alterar(provedor.codigo, 'maxRetries', Number(event.target.value))} />
                </label>
                <label className="field field--wide">
                  <span>{t('integracoes.baseUrl')}</span>
                  <input value={provedor.baseUrl ?? ''} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR)} onChange={(event) => alterar(provedor.codigo, 'baseUrl', event.target.value)} />
                </label>
                <label className="field field--wide">
                  <span>{t('integracoes.referenciaSegredo')}</span>
                  <input value={provedor.referenciaSegredo ?? ''} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR)} onChange={(event) => alterar(provedor.codigo, 'referenciaSegredo', event.target.value)} />
                </label>
              </div>
              {temPermissao(PERMISSOES.INTEGRACAO_EDITAR) ? (
                <div className="form-actions"><Button onClick={() => void salvar(provedor)}>{t('acoes.salvar')}</Button></div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
