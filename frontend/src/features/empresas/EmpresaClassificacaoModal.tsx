import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../../api/http';
import type { EmpresaDetalhe } from '../../api/types';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

export type EmpresaClassificada = EmpresaDetalhe & {
  grupo?: string;
  tags: string[];
};

export function EmpresaClassificacaoModal({
  aberto,
  empresa,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean;
  empresa: EmpresaClassificada;
  aoFechar: () => void;
  aoSalvar: (empresa: EmpresaClassificada) => void;
}) {
  const { t } = useTranslation();
  const [grupo, setGrupo] = useState('');
  const [tagsTexto, setTagsTexto] = useState('');
  const [erro, setErro] = useState<ApiError>();
  const [erroLocal, setErroLocal] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setGrupo(empresa.grupo ?? '');
    setTagsTexto((empresa.tags ?? []).join(', '));
    setErro(undefined);
    setErroLocal('');
  }, [aberto, empresa]);

  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    const tags = normalizarTags(tagsTexto);
    if (tags.length > 20) {
      setErroLocal(t('empresas.classificacao.maxTags'));
      return;
    }
    setSalvando(true);
    setErro(undefined);
    setErroLocal('');
    try {
      const atualizada = await api<EmpresaClassificada>(
        `/empresas/${empresa.id}/classificacao`,
        {
          method: 'PUT',
          body: JSON.stringify({
            grupo: grupo.trim() || null,
            tags,
          }),
        },
      );
      aoSalvar(atualizada);
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      aberto={aberto}
      titulo={t('empresas.classificacao.editarTitulo')}
      aoFechar={aoFechar}
      rodape={
        <>
          <Button type="button" variante="secundario" onClick={aoFechar}>
            {t('acoes.cancelar')}
          </Button>
          <Button type="submit" form="empresa-classificacao-form" disabled={salvando}>
            {t('acoes.salvar')}
          </Button>
        </>
      }
    >
      {erroLocal ? <Alert tipo="erro">{erroLocal}</Alert> : null}
      {erro ? (
        <Alert tipo="erro">
          <strong>{erro.mensagem ?? t('erros.inesperado')}</strong>
          {erro.correlationId ? (
            <small>{t('erros.correlationId', { valor: erro.correlationId })}</small>
          ) : null}
        </Alert>
      ) : null}
      <form id="empresa-classificacao-form" className="form-grid" onSubmit={enviar}>
        <label className="field field--wide">
          <span>{t('empresas.classificacao.grupo')}</span>
          <input
            maxLength={100}
            value={grupo}
            placeholder={t('empresas.classificacao.grupoPlaceholder')}
            onChange={(event) => setGrupo(event.target.value)}
          />
        </label>
        <label className="field field--wide">
          <span>{t('empresas.classificacao.tags')}</span>
          <textarea
            rows={4}
            maxLength={1_500}
            value={tagsTexto}
            placeholder={t('empresas.classificacao.tagsPlaceholder')}
            onChange={(event) => setTagsTexto(event.target.value)}
          />
          <small>{t('empresas.classificacao.tagsAjuda')}</small>
        </label>
      </form>
    </Modal>
  );
}

function normalizarTags(value: string): string[] {
  const unicas = new Map<string, string>();
  for (const parte of value.split(/[,;\n]/)) {
    const tag = parte.trim().replace(/\s+/g, ' ');
    if (!tag) continue;
    unicas.set(tag.toLocaleLowerCase('pt-BR'), tag.slice(0, 60));
  }
  return [...unicas.values()];
}
