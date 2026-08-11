import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../../api/http';
import type { Estabelecimento, FilialPayload, RegimeTributario, StatusEmpresa } from '../../api/types';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

type FilialFormState = FilialPayload & { ativa: boolean };

const vazio: FilialFormState = {
  cnpj: '',
  ativa: true,
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
};

export function FilialFormModal({
  empresaId,
  filial,
  aberto,
  aoFechar,
  aoSalvar,
}: {
  empresaId: string;
  filial?: Estabelecimento;
  aberto: boolean;
  aoFechar: () => void;
  aoSalvar: (filial: Estabelecimento) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FilialFormState>({ ...vazio });
  const [erro, setErro] = useState<ApiError>();
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setForm(filial ? estadoDaFilial(filial) : { ...vazio });
    setErro(undefined);
  }, [aberto, filial]);

  const set = <K extends keyof FilialFormState>(campo: K, valor: FilialFormState[K]) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    setSalvando(true);
    setErro(undefined);
    try {
      const endpoint = filial
        ? `/empresas/${empresaId}/filiais/${filial.id}`
        : `/empresas/${empresaId}/filiais`;
      const body = filial ? form : payloadCriacao(form);
      const filialSalva = await api<Estabelecimento>(endpoint, {
        method: filial ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      aoSalvar(filialSalva);
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      aberto={aberto}
      titulo={t(filial ? 'empresas.filiais.edicaoTitulo' : 'empresas.filiais.cadastroTitulo')}
      aoFechar={aoFechar}
      rodape={
        <>
          <Button type="button" variante="secundario" onClick={aoFechar}>{t('acoes.cancelar')}</Button>
          <Button type="submit" form="filial-form" disabled={salvando}>{t('acoes.salvar')}</Button>
        </>
      }
    >
      {erro ? (
        <Alert tipo="erro">
          <strong>{erro.mensagem ?? t('erros.inesperado')}</strong>
          {erro.correlationId ? <small>{t('erros.correlationId', { valor: erro.correlationId })}</small> : null}
        </Alert>
      ) : null}
      <form id="filial-form" className="form-grid" onSubmit={enviar}>
        <label className="field">
          <span>{t('empresas.campos.cnpj')}</span>
          <input
            required
            disabled={Boolean(filial)}
            inputMode="numeric"
            maxLength={18}
            value={form.cnpj}
            onChange={(event) => set('cnpj', event.target.value)}
          />
          {filial ? <small className="muted">{t('empresas.filiais.cnpjImutavel')}</small> : null}
        </label>
        {filial ? (
          <label className="field">
            <span>{t('empresas.filiais.situacaoCadastro')}</span>
            <select
              value={form.ativa ? 'true' : 'false'}
              onChange={(event) => set('ativa', event.target.value === 'true')}
            >
              <option value="true">{t('empresas.filiais.ativa')}</option>
              <option value="false">{t('empresas.filiais.inativa')}</option>
            </select>
          </label>
        ) : null}
        <label className="field">
          <span>{t('empresas.campos.status')}</span>
          <select value={form.status} onChange={(event) => set('status', event.target.value as StatusEmpresa)}>
            {statusEmpresa.map((status) => <option key={status} value={status}>{t(`empresas.status.${status}`)}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t('empresas.campos.regimeTributario')}</span>
          <select value={form.regimeTributario} onChange={(event) => set('regimeTributario', event.target.value as RegimeTributario)}>
            {regimes.map((regime) => <option key={regime} value={regime}>{t(`empresas.regimes.${regime}`)}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t('empresas.campos.cnaePrincipal')}</span>
          <input maxLength={10} value={form.cnaePrincipal} onChange={(event) => set('cnaePrincipal', event.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.inscricaoEstadual')}</span>
          <input maxLength={60} value={form.inscricaoEstadual} onChange={(event) => set('inscricaoEstadual', event.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.inscricaoMunicipal')}</span>
          <input maxLength={60} value={form.inscricaoMunicipal} onChange={(event) => set('inscricaoMunicipal', event.target.value)} />
        </label>
        <label className="field field--wide">
          <span>{t('empresas.campos.logradouro')}</span>
          <input maxLength={200} value={form.logradouro} onChange={(event) => set('logradouro', event.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.numero')}</span>
          <input maxLength={20} value={form.numero} onChange={(event) => set('numero', event.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.complemento')}</span>
          <input maxLength={100} value={form.complemento} onChange={(event) => set('complemento', event.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.bairro')}</span>
          <input maxLength={100} value={form.bairro} onChange={(event) => set('bairro', event.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.municipio')}</span>
          <input maxLength={100} value={form.municipio} onChange={(event) => set('municipio', event.target.value)} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.uf')}</span>
          <input maxLength={2} value={form.uf} onChange={(event) => set('uf', event.target.value.toUpperCase())} />
        </label>
        <label className="field">
          <span>{t('empresas.campos.cep')}</span>
          <input maxLength={9} value={form.cep} onChange={(event) => set('cep', event.target.value)} />
        </label>
      </form>
    </Modal>
  );
}

function estadoDaFilial(filial: Estabelecimento): FilialFormState {
  return {
    cnpj: filial.cnpj,
    ativa: filial.ativo,
    status: filial.status,
    cnaePrincipal: filial.cnaePrincipal ?? '',
    regimeTributario: filial.regimeTributario,
    inscricaoEstadual: filial.inscricaoEstadual ?? '',
    inscricaoMunicipal: filial.inscricaoMunicipal ?? '',
    logradouro: filial.logradouro ?? '',
    numero: filial.numero ?? '',
    complemento: filial.complemento ?? '',
    bairro: filial.bairro ?? '',
    municipio: filial.municipio ?? '',
    uf: filial.uf ?? '',
    cep: filial.cep ?? '',
  };
}

function payloadCriacao(form: FilialFormState): FilialPayload {
  const { ativa: _ativa, ...payload } = form;
  return payload;
}

const statusEmpresa: StatusEmpresa[] = ['ATIVA', 'INATIVA', 'SUSPENSA', 'BAIXADA', 'DESCONHECIDA'];
const regimes: RegimeTributario[] = ['NAO_INFORMADO', 'MEI', 'SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'OUTRO'];
