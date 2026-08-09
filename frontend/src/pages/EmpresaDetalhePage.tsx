import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/http';
import type { EmpresaDetalhe } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ModulePending } from '../components/ModulePending';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { EmpresaFormModal } from '../features/empresas/EmpresaFormModal';

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
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (!id) return;
    void api<EmpresaDetalhe>(`/empresas/${id}`)
      .then(setEmpresa)
      .catch(() => setErro(true));
  }, [id]);

  if (erro) return <Alert tipo="erro">{t('comum.erroCarregamento')}</Alert>;
  if (!empresa) return null;

  const matriz = empresa.estabelecimentos.find((item) => item.matriz) ?? empresa.estabelecimentos[0];

  return (
    <>
      <PageHeader
        titulo={empresa.razaoSocial}
        descricao={`${t('empresas.detalheTitulo')} · ${formatarCnpj(matriz?.cnpj)}`}
        acoes={
          <>
            <Button variante="secundario" onClick={() => navigate('/empresas')}>{t('acoes.voltar')}</Button>
            {temPermissao(PERMISSOES.EMPRESA_EDITAR) ? (
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
          <Card titulo={t('comum.detalhes')}>
            <dl className="definition-list">
              <div><dt>{t('empresas.campos.cnpj')}</dt><dd>{formatarCnpj(matriz?.cnpj)}</dd></div>
              <div><dt>{t('empresas.campos.status')}</dt><dd>{matriz ? t(`empresas.status.${matriz.status}`) : t('comum.naoInformado')}</dd></div>
              <div><dt>{t('empresas.campos.regimeTributario')}</dt><dd>{matriz ? t(`empresas.regimes.${matriz.regimeTributario}`) : t('comum.naoInformado')}</dd></div>
              <div><dt>{t('empresas.campos.inscricaoEstadual')}</dt><dd>{matriz?.inscricaoEstadual ?? t('comum.naoInformado')}</dd></div>
              <div><dt>{t('empresas.campos.inscricaoMunicipal')}</dt><dd>{matriz?.inscricaoMunicipal ?? t('comum.naoInformado')}</dd></div>
              <div><dt>{t('empresas.campos.municipio')}</dt><dd>{[matriz?.municipio, matriz?.uf].filter(Boolean).join(' / ') || t('comum.naoInformado')}</dd></div>
            </dl>
          </Card>
        </div>
      ) : aba === 'documentos' ? (
        <Card>
          <Button onClick={() => navigate(`/documentos?empresaId=${empresa.id}`)}>{t('menu.documentos')}</Button>
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
    </>
  );
}

function formatarCnpj(cnpj?: string) {
  if (!cnpj || cnpj.length !== 14) return cnpj ?? '';
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
