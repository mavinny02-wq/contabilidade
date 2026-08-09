import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../../api/http';
import type { EmpresaDetalhe, EmpresaPayload, RegimeTributario, StatusEmpresa } from '../../api/types';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

const vazio: EmpresaPayload = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  status: 'ATIVA',
  cnaePrincipal: '',
  regimeTributario: 'NAO_INFORMADO',
  inscricaoEstadual: '',
  inscricaoMunicipal: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  municipio: '',
  uf: '',
  cep: '',
  responsavelNome: '',
  responsavelEmail: '',
};

const deEmpresa = (empresa?: EmpresaDetalhe): EmpresaPayload => {
  if (!empresa) return { ...vazio };
  const matriz = empresa.estabelecimentos.find((item) => item.matriz) ?? empresa.estabelecimentos[0];
  return {
    razaoSocial: empresa.razaoSocial,
    nomeFantasia: empresa.nomeFantasia ?? '',
    cnpj: matriz?.cnpj ?? '',
    status: matriz?.status ?? 'DESCONHECIDA',
    cnaePrincipal: matriz?.cnaePrincipal ?? '',
    regimeTributario: matriz?.regimeTributario ?? 'NAO_INFORMADO',
    inscricaoEstadual: matriz?.inscricaoEstadual ?? '',
    inscricaoMunicipal: matriz?.inscricaoMunicipal ?? '',
    logradouro: matriz?.logradouro ?? '',
    numero: matriz?.numero ?? '',
    complemento: matriz?.complemento ?? '',
    bairro: matriz?.bairro ?? '',
    municipio: matriz?.municipio ?? '',
    uf: matriz?.uf ?? '',
    cep: matriz?.cep ?? '',
    responsavelNome: empresa.responsavelNome ?? '',
    responsavelEmail: empresa.responsavelEmail ?? '',
  };
};

export function EmpresaFormModal({
  aberto,
  empresa,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean;
  empresa?: EmpresaDetalhe;
  aoFechar: () => void;
  aoSalvar: (empresa: EmpresaDetalhe) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<EmpresaPayload>(vazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<ApiError>();

  useEffect(() => {
    if (aberto) {
      setForm(deEmpresa(empresa));
      setErro(undefined);
    }
  }, [aberto, empresa]);

  const set = <K extends keyof EmpresaPayload>(campo: K, valor: EmpresaPayload[K]) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    setSalvando(true);
    setErro(undefined);
    try {
      const resposta = await api<EmpresaDetalhe>(
        empresa ? `/empresas/${empresa.id}` : '/empresas',
        {
          method: empresa ? 'PUT' : 'POST',
          body: JSON.stringify(form),
        },
      );
      aoSalvar(resposta);
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      aberto={aberto}
      titulo={t(empresa ? 'empresas.edicaoTitulo' : 'empresas.cadastroTitulo')}
      aoFechar={aoFechar}
      rodape={
        <>
          <Button type="button" variante="secundario" onClick={aoFechar}>
            {t('acoes.cancelar')}
          </Button>
          <Button type="submit" form="empresa-form" disabled={salvando}>
            {t('acoes.salvar')}
          </Button>
        </>
      }
    >
      {erro ? (
        <Alert tipo="erro">
          <strong>{erro.mensagem ?? t('erros.inesperado')}</strong>
          {erro.correlationId ? (
            <small>{t('erros.correlationId', { valor: erro.correlationId })}</small>
          ) : null}
        </Alert>
      ) : null}
      <form id="empresa-form" className="form-grid" onSubmit={enviar}>
        <label className="field field--wide">
          <span>{t('empresas.campos.razaoSocial')}</span>
          <input required maxLength={200} value={form.razaoSocial} onChange={(e) => set('razaoSocial', e.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.nomeFantasia')}</span>
          <input maxLength={200} value={form.nomeFantasia} onChange={(e) => set('nomeFantasia', e.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.cnpj')}</span>
          <input required inputMode="numeric" maxLength={18} value={form.cnpj} disabled={Boolean(empresa)} onChange={(e) => set('cnpj', e.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.status')}</span>
          <select value={form.status} onChange={(e) => set('status', e.target.value as StatusEmpresa)}>
            {['ATIVA', 'INATIVA', 'SUSPENSA', 'BAIXADA', 'DESCONHECIDA'].map((status) => (
              <option key={status} value={status}>{t(`empresas.status.${status}`)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('empresas.campos.regimeTributario')}</span>
          <select value={form.regimeTributario} onChange={(e) => set('regimeTributario', e.target.value as RegimeTributario)}>
            {['NAO_INFORMADO', 'MEI', 'SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'OUTRO'].map((regime) => (
              <option key={regime} value={regime}>{t(`empresas.regimes.${regime}`)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('empresas.campos.cnaePrincipal')}</span>
          <input maxLength={10} value={form.cnaePrincipal} onChange={(e) => set('cnaePrincipal', e.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.inscricaoEstadual')}</span>
          <input maxLength={60} value={form.inscricaoEstadual} onChange={(e) => set('inscricaoEstadual', e.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.inscricaoMunicipal')}</span>
          <input maxLength={60} value={form.inscricaoMunicipal} onChange={(e) => set('inscricaoMunicipal', e.target.value)} />
        </label>
        <label className="field field--wide">
          <span>{t('empresas.campos.logradouro')}</span>
          <input maxLength={200} value={form.logradouro} onChange={(e) => set('logradouro', e.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.numero')}</span>
          <input maxLength={20} value={form.numero} onChange={(e) => set('numero', e.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.complemento')}</span>
          <input maxLength={100} value={form.complemento} onChange={(e) => set('complemento', e.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.bairro')}</span>
          <input maxLength={100} value={form.bairro} onChange={(e) => set('bairro', e.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.municipio')}</span>
          <input maxLength={100} value={form.municipio} onChange={(e) => set('municipio', e.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.uf')}</span>
          <input maxLength={2} value={form.uf} onChange={(e) => set('uf', e.target.value.toUpperCase())} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.cep')}</span>
          <input maxLength={9} value={form.cep} onChange={(e) => set('cep', e.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.responsavelNome')}</span>
          <input maxLength={160} value={form.responsavelNome} onChange={(e) => set('responsavelNome', e.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.responsavelEmail')}</span>
          <input type="email" maxLength={200} value={form.responsavelEmail} onChange={(e) => set('responsavelEmail', e.target.value)} />
        </label>
      </form>
    </Modal>
  );
}
