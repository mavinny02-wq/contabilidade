import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../api/http';
import type { PoliticaAquisicao, Provedor } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

type Aba = 'provedores' | 'politicas';

export function IntegracoesPage() {
  const { t } = useTranslation();
  const { temPermissao } = useAuth();
  const [aba, setAba] = useState<Aba>('provedores');
  const [provedores, setProvedores] = useState<Provedor[]>([]);
  const [politicas, setPoliticas] = useState<PoliticaAquisicao[]>([]);
  const [erro, setErro] = useState<ApiError>();
  const [mensagem, setMensagem] = useState('');

  const carregar = useCallback(() => {
    setErro(undefined);
    void Promise.all([
      api<Provedor[]>('/integracoes/provedores'),
      api<PoliticaAquisicao[]>('/integracoes/politicas'),
    ])
      .then(([provedoresResponse, politicasResponse]) => {
        setProvedores(provedoresResponse);
        setPoliticas(politicasResponse.sort((a, b) => a.operacao.localeCompare(b.operacao)));
      })
      .catch((exception) => setErro(exception as ApiError));
  }, []);

  useEffect(carregar, [carregar]);

  const alterarProvedor = <K extends keyof Provedor>(codigo: string, campo: K, valor: Provedor[K]) => {
    setProvedores((atuais) => atuais.map((item) => item.codigo === codigo ? { ...item, [campo]: valor } : item));
  };

  const salvarProvedor = async (provedor: Provedor) => {
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
          pago: provedor.pago,
          custoEstimadoPadrao: provedor.custoEstimadoPadrao ?? null,
          moeda: provedor.moeda || null,
        }),
      });
      setProvedores((atuais) => atuais.map((item) => item.codigo === atualizado.codigo ? atualizado : item));
      setMensagem(t('integracoes.mensagemAtualizada'));
    } catch (exception) {
      setErro(exception as ApiError);
    }
  };

  const alterarPolitica = <K extends keyof PoliticaAquisicao>(operacao: string, campo: K, valor: PoliticaAquisicao[K]) => {
    setPoliticas((atuais) => atuais.map((item) => item.operacao === operacao ? { ...item, [campo]: valor } : item));
  };

  const moverProvedor = (politica: PoliticaAquisicao, indice: number, direcao: -1 | 1) => {
    const destino = indice + direcao;
    if (destino < 0 || destino >= politica.provedores.length) return;
    const ordem = [...politica.provedores];
    [ordem[indice], ordem[destino]] = [ordem[destino], ordem[indice]];
    alterarPolitica(politica.operacao, 'provedores', ordem);
  };

  const alternarProvedorPolitica = (politica: PoliticaAquisicao, codigo: string, selecionado: boolean) => {
    const ordem = selecionado
      ? [...politica.provedores, codigo]
      : politica.provedores.filter((item) => item !== codigo);
    alterarPolitica(politica.operacao, 'provedores', ordem);
  };

  const salvarPolitica = async (politica: PoliticaAquisicao) => {
    try {
      const atualizada = await api<PoliticaAquisicao>(`/integracoes/politicas/${politica.operacao}`, {
        method: 'PUT',
        body: JSON.stringify({
          provedores: politica.provedores,
          permitirIntervencao: politica.permitirIntervencao,
          timeoutHumanoMinutos: Number(politica.timeoutHumanoMinutos),
          fallbackPago: politica.fallbackPago,
          custoMaximo: politica.custoMaximo ?? null,
          moeda: politica.moeda || null,
          habilitada: politica.habilitada,
        }),
      });
      setPoliticas((atuais) => atuais.map((item) => item.operacao === atualizada.operacao ? atualizada : item));
      setMensagem(t('integracoes.politicas.mensagemAtualizada'));
    } catch (exception) {
      setErro(exception as ApiError);
    }
  };

  return (
    <>
      <PageHeader
        titulo={t('integracoes.titulo')}
        descricao={t('integracoes.descricao')}
        acoes={<Button variante="secundario" onClick={carregar}>{t('acoes.atualizar')}</Button>}
      />
      {mensagem ? <Alert tipo="sucesso" onClose={() => setMensagem('')}>{mensagem}</Alert> : null}
      {erro ? <Alert tipo="erro" onClose={() => setErro(undefined)}>{erro.mensagem ?? t('erros.inesperado')}</Alert> : null}

      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={aba === 'provedores'} className={aba === 'provedores' ? 'tabs__item tabs__item--active' : 'tabs__item'} onClick={() => setAba('provedores')}>
          {t('integracoes.abas.provedores')}
        </button>
        <button type="button" role="tab" aria-selected={aba === 'politicas'} className={aba === 'politicas' ? 'tabs__item tabs__item--active' : 'tabs__item'} onClick={() => setAba('politicas')}>
          {t('integracoes.abas.politicas')}
        </button>
      </div>

      {aba === 'provedores' ? (
        provedores.length === 0 ? <EmptyState titulo={t('integracoes.listaVazia')} /> : (
          <div className="integration-grid">
            {provedores.map((provedor) => (
              <Card key={provedor.codigo}>
                <div className="card-row__title">
                  <strong>{provedor.nome}</strong>
                  <StatusBadge tom={provedor.habilitado ? 'sucesso' : 'neutro'}>
                    {provedor.habilitado ? t('comum.sim') : t('comum.nao')}
                  </StatusBadge>
                  {provedor.pago ? <StatusBadge tom="aviso">{t('integracoes.pago')}</StatusBadge> : null}
                </div>
                <p className="muted">{t(`integracoes.tipos.${provedor.tipo}`)} · <code>{provedor.codigo}</code></p>
                <div className="form-grid form-grid--compact">
                  <label className="field checkbox-field">
                    <input type="checkbox" checked={provedor.habilitado} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR)} onChange={(event) => alterarProvedor(provedor.codigo, 'habilitado', event.target.checked)} />
                    <span>{t('integracoes.habilitado')}</span>
                  </label>
                  <label className="field checkbox-field">
                    <input type="checkbox" checked={provedor.pago} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR)} onChange={(event) => alterarProvedor(provedor.codigo, 'pago', event.target.checked)} />
                    <span>{t('integracoes.pago')}</span>
                  </label>
                  <label className="field"><span>{t('integracoes.prioridade')}</span><input type="number" min={0} max={1000} value={provedor.prioridade} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR)} onChange={(event) => alterarProvedor(provedor.codigo, 'prioridade', Number(event.target.value))} /></label>
                  <label className="field"><span>{t('integracoes.timeout')}</span><input type="number" min={1} max={3600} value={provedor.timeoutSegundos} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR)} onChange={(event) => alterarProvedor(provedor.codigo, 'timeoutSegundos', Number(event.target.value))} /></label>
                  <label className="field"><span>{t('integracoes.retries')}</span><input type="number" min={0} max={10} value={provedor.maxRetries} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR)} onChange={(event) => alterarProvedor(provedor.codigo, 'maxRetries', Number(event.target.value))} /></label>
                  <label className="field"><span>{t('integracoes.custoEstimado')}</span><input type="number" min={0} step="0.0001" value={provedor.custoEstimadoPadrao ?? ''} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR) || !provedor.pago} onChange={(event) => alterarProvedor(provedor.codigo, 'custoEstimadoPadrao', event.target.value ? Number(event.target.value) : undefined)} /></label>
                  <label className="field"><span>{t('integracoes.moeda')}</span><input maxLength={3} value={provedor.moeda ?? ''} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR) || !provedor.pago} onChange={(event) => alterarProvedor(provedor.codigo, 'moeda', event.target.value.toUpperCase())} /></label>
                  <label className="field field--wide"><span>{t('integracoes.baseUrl')}</span><input value={provedor.baseUrl ?? ''} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR)} onChange={(event) => alterarProvedor(provedor.codigo, 'baseUrl', event.target.value)} /></label>
                  <label className="field field--wide"><span>{t('integracoes.referenciaSegredo')}</span><input value={provedor.referenciaSegredo ?? ''} disabled={!temPermissao(PERMISSOES.INTEGRACAO_EDITAR)} onChange={(event) => alterarProvedor(provedor.codigo, 'referenciaSegredo', event.target.value)} /></label>
                </div>
                {temPermissao(PERMISSOES.INTEGRACAO_EDITAR) ? <div className="form-actions"><Button onClick={() => void salvarProvedor(provedor)}>{t('acoes.salvar')}</Button></div> : null}
              </Card>
            ))}
          </div>
        )
      ) : (
        politicas.length === 0 ? <EmptyState titulo={t('integracoes.politicas.listaVazia')} /> : (
          <div className="card-list">
            {politicas.map((politica) => (
              <PoliticaCard
                key={politica.operacao}
                politica={politica}
                provedores={provedores}
                editavel={temPermissao(PERMISSOES.INTEGRACAO_EDITAR)}
                aoAlterar={(campo, valor) => alterarPolitica(politica.operacao, campo, valor)}
                aoAlternar={(codigo, selecionado) => alternarProvedorPolitica(politica, codigo, selecionado)}
                aoMover={(indice, direcao) => moverProvedor(politica, indice, direcao)}
                aoSalvar={() => void salvarPolitica(politica)}
              />
            ))}
          </div>
        )
      )}
    </>
  );
}

function PoliticaCard({
  politica,
  provedores,
  editavel,
  aoAlterar,
  aoAlternar,
  aoMover,
  aoSalvar,
}: {
  politica: PoliticaAquisicao;
  provedores: Provedor[];
  editavel: boolean;
  aoAlterar: <K extends keyof PoliticaAquisicao>(campo: K, valor: PoliticaAquisicao[K]) => void;
  aoAlternar: (codigo: string, selecionado: boolean) => void;
  aoMover: (indice: number, direcao: -1 | 1) => void;
  aoSalvar: () => void;
}) {
  const { t } = useTranslation();
  const byCode = useMemo(() => new Map(provedores.map((item) => [item.codigo, item])), [provedores]);
  const selecionados = politica.provedores.map((codigo) => byCode.get(codigo)).filter((item): item is Provedor => Boolean(item));
  const disponiveis = provedores.filter((item) => !politica.provedores.includes(item.codigo));

  return (
    <Card>
      <div className="card-row__title">
        <strong>{t(`integracoes.operacoes.${politica.operacao}`, { defaultValue: politica.operacao })}</strong>
        <StatusBadge tom={politica.habilitada ? 'sucesso' : 'neutro'}>{politica.habilitada ? t('comum.sim') : t('comum.nao')}</StatusBadge>
      </div>
      <p className="muted"><code>{politica.operacao}</code></p>
      <div className="provider-order">
        <span className="field-label">{t('integracoes.politicas.ordem')}</span>
        {selecionados.map((provedor, indice) => (
          <div className="provider-order__item" key={provedor.codigo}>
            <span className="provider-order__position">{indice + 1}</span>
            <div><strong>{provedor.nome}</strong><small>{t(`integracoes.tipos.${provedor.tipo}`)}</small></div>
            <div className="provider-order__actions">
              <Button variante="texto" disabled={!editavel || indice === 0} onClick={() => aoMover(indice, -1)} aria-label={t('integracoes.politicas.subir')}>↑</Button>
              <Button variante="texto" disabled={!editavel || indice === selecionados.length - 1} onClick={() => aoMover(indice, 1)} aria-label={t('integracoes.politicas.descer')}>↓</Button>
              <Button variante="texto" disabled={!editavel} onClick={() => aoAlternar(provedor.codigo, false)}>{t('acoes.remover')}</Button>
            </div>
          </div>
        ))}
        {disponiveis.length > 0 && editavel ? (
          <label className="field provider-order__add">
            <span>{t('integracoes.politicas.adicionarProvedor')}</span>
            <select defaultValue="" onChange={(event) => { if (event.target.value) { aoAlternar(event.target.value, true); event.target.value = ''; } }}>
              <option value="">{t('integracoes.politicas.selecione')}</option>
              {disponiveis.map((provedor) => <option key={provedor.codigo} value={provedor.codigo}>{provedor.nome}</option>)}
            </select>
          </label>
        ) : null}
      </div>
      <div className="form-grid form-grid--compact">
        <label className="field checkbox-field"><input type="checkbox" checked={politica.habilitada} disabled={!editavel} onChange={(event) => aoAlterar('habilitada', event.target.checked)} /><span>{t('integracoes.politicas.habilitada')}</span></label>
        <label className="field checkbox-field"><input type="checkbox" checked={politica.permitirIntervencao} disabled={!editavel} onChange={(event) => aoAlterar('permitirIntervencao', event.target.checked)} /><span>{t('integracoes.politicas.intervencao')}</span></label>
        <label className="field"><span>{t('integracoes.politicas.timeoutHumano')}</span><input type="number" min={1} max={1440} value={politica.timeoutHumanoMinutos} disabled={!editavel || !politica.permitirIntervencao} onChange={(event) => aoAlterar('timeoutHumanoMinutos', Number(event.target.value))} /></label>
        <label className="field checkbox-field"><input type="checkbox" checked={politica.fallbackPago} disabled={!editavel} onChange={(event) => aoAlterar('fallbackPago', event.target.checked)} /><span>{t('integracoes.politicas.fallbackPago')}</span></label>
        <label className="field"><span>{t('integracoes.politicas.custoMaximo')}</span><input type="number" min={0} step="0.0001" value={politica.custoMaximo ?? ''} disabled={!editavel || !politica.fallbackPago} onChange={(event) => aoAlterar('custoMaximo', event.target.value ? Number(event.target.value) : undefined)} /></label>
        <label className="field"><span>{t('integracoes.moeda')}</span><input maxLength={3} value={politica.moeda ?? ''} disabled={!editavel || !politica.fallbackPago} onChange={(event) => aoAlterar('moeda', event.target.value.toUpperCase())} /></label>
      </div>
      {editavel ? <div className="form-actions"><Button onClick={aoSalvar}>{t('acoes.salvar')}</Button></div> : null}
    </Card>
  );
}
