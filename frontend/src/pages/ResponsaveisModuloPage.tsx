import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type ApiError } from '../api/http';
import type { EmpresaDetalhe } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

type ModuloEmpresa = 'FISCAL' | 'CONTABIL' | 'FINANCEIRO' | 'DOCUMENTOS' | 'AUTOMACAO' | 'ADMINISTRACAO';

type ResponsavelModulo = {
  id?: string;
  empresaId?: string;
  modulo: ModuloEmpresa;
  nome: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  atualizadoEm?: string;
};

const modulos: ModuloEmpresa[] = [
  'FISCAL',
  'CONTABIL',
  'FINANCEIRO',
  'DOCUMENTOS',
  'AUTOMACAO',
  'ADMINISTRACAO',
];

export function ResponsaveisModuloPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { temPermissao } = useAuth();
  const [empresa, setEmpresa] = useState<EmpresaDetalhe>();
  const [itens, setItens] = useState<Record<ModuloEmpresa, ResponsavelModulo>>(estadoInicial);
  const [salvando, setSalvando] = useState<Set<ModuloEmpresa>>(new Set());
  const [erro, setErro] = useState<ApiError>();
  const [mensagem, setMensagem] = useState('');

  const editavel = temPermissao(PERMISSOES.EMPRESA_EDITAR);

  useEffect(() => {
    if (!id) return;
    setErro(undefined);
    void Promise.all([
      api<EmpresaDetalhe>(`/empresas/${id}`),
      api<ResponsavelModulo[]>(`/empresas/${id}/responsaveis-modulo`),
    ])
      .then(([empresaResponse, responsaveis]) => {
        setEmpresa(empresaResponse);
        const proximo = estadoInicial();
        responsaveis.forEach((item) => { proximo[item.modulo] = item; });
        setItens(proximo);
      })
      .catch((exception) => setErro(exception as ApiError));
  }, [id]);

  const configurados = useMemo(
    () => Object.values(itens).filter((item) => item.id && item.ativo).length,
    [itens],
  );

  const alterar = <K extends keyof ResponsavelModulo>(
    modulo: ModuloEmpresa,
    campo: K,
    valor: ResponsavelModulo[K],
  ) => {
    setItens((atuais) => ({
      ...atuais,
      [modulo]: { ...atuais[modulo], [campo]: valor },
    }));
  };

  const salvar = async (modulo: ModuloEmpresa) => {
    if (!id) return;
    const item = itens[modulo];
    setErro(undefined);
    setSalvando((atuais) => new Set(atuais).add(modulo));
    try {
      const salvo = await api<ResponsavelModulo>(`/empresas/${id}/responsaveis-modulo/${modulo}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome: item.nome,
          email: item.email || null,
          telefone: item.telefone || null,
          ativo: item.ativo,
        }),
      });
      setItens((atuais) => ({ ...atuais, [modulo]: salvo }));
      setMensagem(t('responsaveisModulo.mensagemSalvo', { modulo: t(`responsaveisModulo.modulos.${modulo}`) }));
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setSalvando((atuais) => {
        const proximo = new Set(atuais);
        proximo.delete(modulo);
        return proximo;
      });
    }
  };

  if (!id) return null;

  return (
    <>
      <PageHeader
        titulo={t('responsaveisModulo.titulo')}
        descricao={empresa
          ? t('responsaveisModulo.descricaoEmpresa', { empresa: empresa.razaoSocial })
          : t('responsaveisModulo.descricao')}
        acoes={
          <Button variante="secundario" onClick={() => navigate(`/empresas/${id}`)}>
            {t('acoes.voltar')}
          </Button>
        }
      />

      {mensagem ? <Alert tipo="sucesso" onClose={() => setMensagem('')}>{mensagem}</Alert> : null}
      {erro ? (
        <Alert tipo="erro" onClose={() => setErro(undefined)}>
          {erro.mensagem ?? t('erros.inesperado')}
        </Alert>
      ) : null}

      <div className="metric-grid">
        <Card className="metric-card">
          <span>{t('responsaveisModulo.configurados')}</span>
          <strong>{configurados} / {modulos.length}</strong>
        </Card>
        <Card className="metric-card">
          <span>{t('responsaveisModulo.empresa')}</span>
          <strong>{empresa?.razaoSocial ?? '—'}</strong>
        </Card>
      </div>

      <div className="card-list">
        {modulos.map((modulo) => {
          const item = itens[modulo];
          return (
            <Card key={modulo}>
              <form onSubmit={(event) => { event.preventDefault(); void salvar(modulo); }}>
              <div className="card-row__title">
                <strong>{t(`responsaveisModulo.modulos.${modulo}`)}</strong>
                <StatusBadge tom={item.id && item.ativo ? 'sucesso' : 'neutro'}>
                  {t(item.id && item.ativo ? 'responsaveisModulo.ativo' : 'responsaveisModulo.naoConfigurado')}
                </StatusBadge>
              </div>
              <div className="form-grid form-grid--compact">
                <label className="field field--wide">
                  <span>{t('responsaveisModulo.nome')}</span>
                  <input
                    required
                    maxLength={160}
                    value={item.nome}
                    disabled={!editavel}
                    onChange={(event) => alterar(modulo, 'nome', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{t('responsaveisModulo.email')}</span>
                  <input
                    type="email"
                    maxLength={200}
                    value={item.email ?? ''}
                    disabled={!editavel}
                    onChange={(event) => alterar(modulo, 'email', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{t('responsaveisModulo.telefone')}</span>
                  <input
                    maxLength={40}
                    value={item.telefone ?? ''}
                    disabled={!editavel}
                    onChange={(event) => alterar(modulo, 'telefone', event.target.value)}
                  />
                </label>
                <label className="field checkbox-field">
                  <input
                    type="checkbox"
                    checked={item.ativo}
                    disabled={!editavel}
                    onChange={(event) => alterar(modulo, 'ativo', event.target.checked)}
                  />
                  <span>{t('responsaveisModulo.ativo')}</span>
                </label>
              </div>
              {editavel ? (
                <div className="form-actions">
                  <Button
                    type="submit"
                    disabled={!item.nome.trim() || salvando.has(modulo)}
                  >
                    {t('acoes.salvar')}
                  </Button>
                </div>
              ) : null}
              </form>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function estadoInicial(): Record<ModuloEmpresa, ResponsavelModulo> {
  return Object.fromEntries(modulos.map((modulo) => [
    modulo,
    { modulo, nome: '', email: '', telefone: '', ativo: true },
  ])) as Record<ModuloEmpresa, ResponsavelModulo>;
}
