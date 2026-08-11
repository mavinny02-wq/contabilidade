import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/http';
import type { EmpresaDetalhe, EmpresaResumo, Pagina } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { EmpresaFormModal } from '../features/empresas/EmpresaFormModal';
import { EmpresaImportacaoCsvModal } from '../features/empresas/EmpresaImportacaoCsvModal';

type EmpresaResumoClassificada = EmpresaResumo & {
  grupo?: string;
  tags: string[];
};

export function EmpresasPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { temPermissao } = useAuth();
  const [pagina, setPagina] = useState(0);
  const [termo, setTermo] = useState('');
  const [consulta, setConsulta] = useState('');
  const [dados, setDados] = useState<Pagina<EmpresaResumoClassificada>>();
  const [erro, setErro] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [importacaoAberta, setImportacaoAberta] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const carregar = useCallback(() => {
    setErro(false);
    void api<Pagina<EmpresaResumoClassificada>>(
      `/empresas?pagina=${pagina}&tamanho=20&termo=${encodeURIComponent(consulta)}`,
    )
      .then(setDados)
      .catch(() => setErro(true));
  }, [consulta, pagina]);

  useEffect(carregar, [carregar]);

  const buscar = (event: FormEvent) => {
    event.preventDefault();
    setPagina(0);
    setConsulta(termo.trim());
  };

  const aoSalvar = (empresa: EmpresaDetalhe) => {
    setModalAberto(false);
    setMensagem(t('empresas.mensagens.criada'));
    carregar();
    navigate(`/empresas/${empresa.id}`);
  };

  const aoImportar = (quantidade: number) => {
    setMensagem(t('empresas.importacao.mensagemImportadas', { quantidade }));
    setPagina(0);
    setConsulta('');
    setTermo('');
    carregar();
  };

  return (
    <>
      <PageHeader
        titulo={t('empresas.titulo')}
        descricao={t('empresas.descricao')}
        acoes={
          temPermissao(PERMISSOES.EMPRESA_EDITAR) ? (
            <>
              <Button variante="secundario" onClick={() => setImportacaoAberta(true)}>
                {t('empresas.importacao.acao')}
              </Button>
              <Button onClick={() => setModalAberto(true)}>{t('acoes.novaEmpresa')}</Button>
            </>
          ) : undefined
        }
      />
      {mensagem ? <Alert tipo="sucesso" onClose={() => setMensagem('')}>{mensagem}</Alert> : null}
      {erro ? <Alert tipo="erro">{t('comum.erroCarregamento')}</Alert> : null}
      <form className="filter-bar" onSubmit={buscar}>
        <input
          value={termo}
          onChange={(event) => setTermo(event.target.value)}
          placeholder={t('empresas.classificacao.buscarPlaceholder')}
          aria-label={t('empresas.classificacao.buscarPlaceholder')}
        />
        <Button type="submit" variante="secundario">{t('acoes.buscar')}</Button>
        {consulta ? (
          <Button type="button" variante="texto" onClick={() => { setTermo(''); setConsulta(''); setPagina(0); }}>
            {t('acoes.limpar')}
          </Button>
        ) : null}
      </form>

      {dados?.content.length === 0 ? (
        <EmptyState
          titulo={t('empresas.listaVazia')}
          descricao={t('empresas.listaVaziaDescricao')}
          acao={
            temPermissao(PERMISSOES.EMPRESA_EDITAR) ? (
              <Button onClick={() => setModalAberto(true)}>{t('acoes.novaEmpresa')}</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('empresas.campos.razaoSocial')}</th>
                  <th>{t('empresas.campos.cnpj')}</th>
                  <th>{t('empresas.classificacao.grupo')}</th>
                  <th>{t('empresas.campos.status')}</th>
                  <th>{t('empresas.campos.regimeTributario')}</th>
                  <th>{t('empresas.campos.municipio')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {dados?.content.map((empresa) => (
                  <tr key={empresa.id}>
                    <td>
                      <strong>{empresa.razaoSocial}</strong>
                      {empresa.nomeFantasia ? <span className="table-secondary">{empresa.nomeFantasia}</span> : null}
                      {empresa.tags.length > 0 ? (
                        <span className="table-secondary">
                          {empresa.tags.slice(0, 4).join(' · ')}
                          {empresa.tags.length > 4 ? ` +${empresa.tags.length - 4}` : ''}
                        </span>
                      ) : null}
                    </td>
                    <td>{formatarCnpj(empresa.cnpj)}</td>
                    <td>{empresa.grupo ?? t('empresas.classificacao.semGrupo')}</td>
                    <td>
                      <StatusBadge tom={empresa.status === 'ATIVA' ? 'sucesso' : 'neutro'}>
                        {empresa.status ? t(`empresas.status.${empresa.status}`) : t('comum.naoInformado')}
                      </StatusBadge>
                    </td>
                    <td>{empresa.regimeTributario ? t(`empresas.regimes.${empresa.regimeTributario}`) : t('comum.naoInformado')}</td>
                    <td>{[empresa.municipio, empresa.uf].filter(Boolean).join(' / ') || t('comum.naoInformado')}</td>
                    <td className="table-actions">
                      <Button variante="texto" onClick={() => navigate(`/empresas/${empresa.id}`)}>
                        {t('acoes.abrir')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagina={pagina} totalPaginas={dados?.totalPages ?? 0} aoMudar={setPagina} />
        </div>
      )}

      <EmpresaFormModal
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aoSalvar}
      />
      <EmpresaImportacaoCsvModal
        aberto={importacaoAberta}
        aoFechar={() => setImportacaoAberta(false)}
        aoImportar={aoImportar}
      />
    </>
  );
}

function formatarCnpj(cnpj?: string) {
  if (!cnpj || cnpj.length !== 14) return cnpj ?? '';
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
