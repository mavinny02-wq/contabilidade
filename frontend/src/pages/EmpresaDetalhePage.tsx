import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/http';
import type { EmpresaDetalhe, Estabelecimento } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ModulePending } from '../components/ModulePending';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { EmpresaFormModal } from '../features/empresas/EmpresaFormModal';
import { FilialFormModal } from '../features/empresas/FilialFormModal';

const abas = ['resumo', 'certidoes', 'obrigacoes', 'pendencias', 'mensagens', 'guias', 'documentos', 'automacao', 'historico'] as const;
type Aba = (typeof abas)[number];

export function EmpresaDetalhePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { temPermissao } = useAuth();
  const [empresa, setEmpresa] = useState<EmpresaDetalhe>();
  const [aba, setAba] = useState<Aba>('resumo');
  const [erro, setErro] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [filialAberta, setFilialAberta] = useState(false);
  const [filialSelecionada, setFilialSelecionada] = useState<Estabelecimento>();
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (!id) return;
    void api<EmpresaDetalhe>(`/empresas/${id}`)
      .then(setEmpresa)
      .catch(() => setErro(true));
  }, [id]);

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
            {matriz ? <EstabelecimentoCard item={matriz} titulo={t('empresas.filiais.matriz')} /> : null}
          </div>
          <Card
            titulo={t('empresas.filiais.titulo')}
            className="company-establishments"
          >
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
      ) : (
        <Card><ModulePending /></Card>
      )}

      <EmpresaFormModal
        aberto={modalAberto}
        empresa={empresa}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={(atualizada) => {
          setEmpresa(atualizada);
          setModalAberto(false);
          setMensagem(t('empresas.mensagens.atualizada'));
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
