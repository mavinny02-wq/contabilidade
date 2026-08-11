import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/http';
import type { Estabelecimento, Pagina } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ModulePending } from '../components/ModulePending';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import {
  EmpresaClassificacaoModal,
  type EmpresaClassificada,
} from '../features/empresas/EmpresaClassificacaoModal';
import { EmpresaFormModal } from '../features/empresas/EmpresaFormModal';
import { FilialFormModal } from '../features/empresas/FilialFormModal';

const abas = ['resumo', 'certidoes', 'obrigacoes', 'pendencias', 'mensagens', 'guias', 'documentos', 'automacao', 'historico'] as const;
type Aba = (typeof abas)[number];

type EmpresaHistoricoEvento = {
  id: string;
  acao: string;
  recursoTipo: 'EMPRESA' | 'ESTABELECIMENTO' | string;
  recursoId?: string;
  ator: string;
  correlationId?: string;
  criadoEm: string;
};

export function EmpresaDetalhePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { temPermissao } = useAuth();
  const [empresa, setEmpresa] = useState<EmpresaClassificada>();
  const [aba, setAba] = useState<Aba>('resumo');
  const [erro, setErro] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [classificacaoAberta, setClassificacaoAberta] = useState(false);
  const [filialAberta, setFilialAberta] = useState(false);
  const [filialSelecionada, setFilialSelecionada] = useState<Estabelecimento>();
  const [mensagem, setMensagem] = useState('');
  const [historico, setHistorico] = useState<EmpresaHistoricoEvento[]>([]);
  const [historicoCarregando, setHistoricoCarregando] = useState(false);
  const [historicoErro, setHistoricoErro] = useState(false);

  useEffect(() => {
    if (!id) return;
    void api<EmpresaClassificada>(`/empresas/${id}`)
      .then(setEmpresa)
      .catch(() => setErro(true));
  }, [id]);

  useEffect(() => {
    if (!id || aba !== 'historico') return;
    setHistoricoCarregando(true);
    setHistoricoErro(false);
    void api<Pagina<EmpresaHistoricoEvento>>(`/empresas/${id}/historico?pagina=0&tamanho=100`)
      .then((response) => setHistorico(response.content))
      .catch(() => setHistoricoErro(true))
      .finally(() => setHistoricoCarregando(false));
  }, [aba, id]);

  if (erro) return <Alert tipo="erro">{t('comum.erroCarregamento')}</Alert>;
  if (!empresa || !id) return null;

  const matriz = empresa.estabelecimentos.find((item) => item.matriz) ?? empresa.estabelecimentos[0];
  const filiais = empresa.estabelecimentos.filter((item) => !item.matriz);
  const podeEditar = temPermissao(PERMISSOES.EMPRESA_EDITAR);

  const abrirNovaFilial = () => {
    setFilialSelecionada(undefined);
    setFilialAberta(true);
  };

  const editarFilial = (filial: Estabelecimento) => {
    setFilialSelecionada(filial);
    setFilialAberta(true);
  };

  const salvarFilial = (filial: Estabelecimento) => {
    const editando = Boolean(filialSelecionada);
    setEmpresa((atual) => {
      if (!atual) return atual;
      const existente = atual.estabelecimentos.some((item) => item.id === filial.id);
      return {
        ...atual,
        estabelecimentos: existente
          ? atual.estabelecimentos.map((item) => item.id === filial.id ? filial : item)
          : [...atual.estabelecimentos, filial],
      };
    });
    setFilialAberta(false);
    setFilialSelecionada(undefined);
    setMensagem(t(editando ? 'empresas.filiais.mensagemAtualizada' : 'empresas.filiais.mensagemCriada'));
  };

  return (
    <>
      <PageHeader
        titulo={empresa.razaoSocial}
        descricao={`${t('empresas.detalheTitulo')} · ${formatarCnpj(matriz?.cnpj)}`}
        acoes={
          <>
            <Button variante="secundario" onClick={() => navigate('/empresas')}>{t('acoes.voltar')}</Button>
            {podeEditar ? (
              <Button onClick={() => setModalAberto(true)}>{t('acoes.editar')}</Button>
            ) : null}
          </>
        }
      />
      {mensagem ? <Alert tipo="sucesso" onClose={() => setMensagem('')}>{mensagem}</Alert> : null}
      <div className="tabs" role="tablist">
        {abas.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={aba === item}
            className={aba === item ? 'tabs__item tabs__item--active' : 'tabs__item'}
            onClick={() => setAba(item)}
          >
            {t(`empresas.abas.${item}`)}
          </button>
        ))}
      </div>

      {aba === 'resumo' ? (
        <div className="stack">
          <div className="detail-grid">
            <Card titulo={t('empresas.abas.resumo')}>
              <dl className="definition-list">
                <div><dt>{t('empresas.campos.razaoSocial')}</dt><dd>{empresa.razaoSocial}</dd></div>
                <div><dt>{t('empresas.campos.nomeFantasia')}</dt><dd>{empresa.nomeFantasia ?? t('comum.naoInformado')}</dd></div>
                <div><dt>{t('empresas.campos.ativa')}</dt><dd><StatusBadge tom={empresa.ativa ? 'sucesso' : 'neutro'}>{t(empresa.ativa ? 'comum.sim' : 'comum.nao')}</StatusBadge></dd></div>
                <div><dt>{t('empresas.campos.responsavelNome')}</dt><dd>{empresa.responsavelNome ?? t('comum.naoInformado')}</dd></div>
                <div><dt>{t('empresas.campos.responsavelEmail')}</dt><dd>{empresa.responsavelEmail ?? t('comum.naoInformado')}</dd></div>
              </dl>
            </Card>
            <Card titulo={t('empresas.classificacao.titulo')}>
              <div className="section-toolbar">
                <p className="muted">{t('empresas.classificacao.descricao')}</p>
                {podeEditar ? (
                  <Button variante="texto" onClick={() => setClassificacaoAberta(true)}>
                    {t('acoes.editar')}
                  </Button>
                ) : null}
              </div>
              <dl className="definition-list definition-list--compact">
                <div>
                  <dt>{t('empresas.classificacao.grupo')}</dt>
                  <dd>{empresa.grupo ?? t('empresas.classificacao.semGrupo')}</dd>
                </div>
              </dl>
              {empresa.tags.length === 0 ? (
                <p className="muted">{t('empresas.classificacao.semTags')}</p>
              ) : (
                <div className="card-row__title">
                  {empresa.tags.map((tag) => <StatusBadge key={tag} tom="neutro">{tag}</StatusBadge>)}
                </div>
              )}
            </Card>
            {matriz ? <EstabelecimentoCard item={matriz} titulo={t('empresas.filiais.matriz')} /> : null}
          </div>
          <Card titulo={t('empresas.filiais.titulo')} className="company-establishments">
            <div className="section-toolbar">
              <p className="muted">{t('empresas.filiais.descricao')}</p>
              {podeEditar ? (
                <Button variante="secundario" onClick={abrirNovaFilial}>{t('empresas.filiais.adicionar')}</Button>
              ) : null}
            </div>
            {filiais.length === 0 ? (
              <p className="muted">{t('empresas.filiais.vazio')}</p>
            ) : (
              <div className="establishment-grid">
                {filiais.map((filial) => (
                  <EstabelecimentoCard
                    key={filial.id}
                    item={filial}
                    titulo={t('empresas.filiais.filial')}
                    podeEditar={podeEditar}
                    aoEditar={() => editarFilial(filial)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : aba === 'certidoes' ? (
        <Card>
          <div className="module-callout">
            <div>
              <h2>{t('certidoes.titulo')}</h2>
              <p>{t('certidoes.empresaDescricao')}</p>
            </div>
            <Button onClick={() => navigate(`/certidoes?empresaId=${empresa.id}`)}>{t('certidoes.acoes.abrirCentro')}</Button>
          </div>
        </Card>
      ) : aba === 'documentos' ? (
        <Card>
          <div className="module-callout">
            <div>
              <h2>{t('documentos.titulo')}</h2>
              <p>{t('documentos.descricao')}</p>
            </div>
            <Button onClick={() => navigate(`/documentos?empresaId=${empresa.id}`)}>{t('menu.documentos')}</Button>
          </div>
        </Card>
      ) : aba === 'historico' ? (
        <HistoricoEmpresa
          eventos={historico}
          carregando={historicoCarregando}
          erro={historicoErro}
        />
      ) : (
        <Card><ModulePending /></Card>
      )}

      <EmpresaFormModal
        aberto={modalAberto}
        empresa={empresa}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={(atualizada) => {
          setEmpresa(atualizada as EmpresaClassificada);
          setModalAberto(false);
          setMensagem(t('empresas.mensagens.atualizada'));
        }}
      />
      <EmpresaClassificacaoModal
        aberto={classificacaoAberta}
        empresa={empresa}
        aoFechar={() => setClassificacaoAberta(false)}
        aoSalvar={(atualizada) => {
          setEmpresa(atualizada);
          setClassificacaoAberta(false);
          setMensagem(t('empresas.classificacao.salva'));
        }}
      />
      <FilialFormModal
        empresaId={id}
        filial={filialSelecionada}
        aberto={filialAberta}
        aoFechar={() => {
          setFilialAberta(false);
          setFilialSelecionada(undefined);
        }}
        aoSalvar={salvarFilial}
      />
    </>
  );
}

function HistoricoEmpresa({
  eventos,
  carregando,
  erro,
}: {
  eventos: EmpresaHistoricoEvento[];
  carregando: boolean;
  erro: boolean;
}) {
  const { t } = useTranslation();
  if (erro) return <Alert tipo="erro">{t('comum.erroCarregamento')}</Alert>;
  if (carregando) return <Card><p className="muted">{t('empresas.historico.carregando')}</p></Card>;
  if (eventos.length === 0) {
    return <EmptyState titulo={t('empresas.historico.vazio')} descricao={t('empresas.historico.vazioDescricao')} />;
  }
  return (
    <div className="card-list">
      {eventos.map((evento) => (
        <Card key={evento.id} className="card-row">
          <div>
            <div className="card-row__title">
              <strong>{t(`empresas.historico.acoes.${evento.acao}`, { defaultValue: evento.acao })}</strong>
              <StatusBadge tom="neutro">
                {t(evento.recursoTipo === 'EMPRESA'
                  ? 'empresas.historico.recursos.empresa'
                  : 'empresas.historico.recursos.estabelecimento')}
              </StatusBadge>
            </div>
            <p className="muted">
              {t('empresas.historico.realizadoPor', { ator: evento.ator })}
            </p>
            <small>
              {formatarDataHora(evento.criadoEm)}
              {evento.correlationId ? ` · ${t('empresas.historico.correlationId')}: ${evento.correlationId}` : ''}
            </small>
          </div>
        </Card>
      ))}
    </div>
  );
}

function EstabelecimentoCard({
  item,
  titulo,
  podeEditar = false,
  aoEditar,
}: {
  item: Estabelecimento;
  titulo: string;
  podeEditar?: boolean;
  aoEditar?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Card className="establishment-card">
      <div className="card-row">
        <div className="card-row__title">
          <strong>{titulo}</strong>
          <StatusBadge tom={item.ativo ? 'sucesso' : 'neutro'}>
            {t(item.ativo ? 'empresas.filiais.ativa' : 'empresas.filiais.inativa')}
          </StatusBadge>
          <StatusBadge tom={item.status === 'ATIVA' ? 'sucesso' : 'neutro'}>
            {t(`empresas.status.${item.status}`)}
          </StatusBadge>
        </div>
        {podeEditar && aoEditar ? (
          <Button variante="texto" onClick={aoEditar}>{t('acoes.editar')}</Button>
        ) : null}
      </div>
      <dl className="definition-list definition-list--compact">
        <div><dt>{t('empresas.campos.cnpj')}</dt><dd>{formatarCnpj(item.cnpj)}</dd></div>
        <div><dt>{t('empresas.campos.regimeTributario')}</dt><dd>{t(`empresas.regimes.${item.regimeTributario}`)}</dd></div>
        <div><dt>{t('empresas.campos.inscricaoEstadual')}</dt><dd>{item.inscricaoEstadual ?? t('comum.naoInformado')}</dd></div>
        <div><dt>{t('empresas.campos.inscricaoMunicipal')}</dt><dd>{item.inscricaoMunicipal ?? t('comum.naoInformado')}</dd></div>
        <div><dt>{t('empresas.campos.municipio')}</dt><dd>{[item.municipio, item.uf].filter(Boolean).join(' / ') || t('comum.naoInformado')}</dd></div>
      </dl>
    </Card>
  );
}

function formatarCnpj(cnpj?: string) {
  if (!cnpj || cnpj.length !== 14) return cnpj ?? '';
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatarDataHora(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
