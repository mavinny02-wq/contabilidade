import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../../api/http';
import type { Documento } from '../../api/types';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

const tipos = ['OUTRO', 'CERTIDAO', 'GUIA', 'COMPROVANTE', 'DECLARACAO', 'PROTOCOLO'];

export function DocumentoMetadadosModal({
  documento,
  aoFechar,
  aoSalvar,
}: {
  documento?: Documento;
  aoFechar: () => void;
  aoSalvar: (documento: Documento) => void;
}) {
  const { t } = useTranslation();
  const [tipo, setTipo] = useState('OUTRO');
  const [emitidoEm, setEmitidoEm] = useState('');
  const [validoAte, setValidoAte] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<ApiError>();

  useEffect(() => {
    if (!documento) return;
    setTipo(documento.tipo);
    setEmitidoEm(documento.emitidoEm ?? '');
    setValidoAte(documento.validoAte ?? '');
    setErro(undefined);
  }, [documento]);

  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    if (!documento) return;
    setSalvando(true);
    setErro(undefined);
    try {
      const atualizado = await api<Documento>(`/documentos/${documento.id}/metadados`, {
        method: 'PUT',
        body: JSON.stringify({
          tipo,
          emitidoEm: emitidoEm || null,
          validoAte: validoAte || null,
        }),
      });
      aoSalvar(atualizado);
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      aberto={Boolean(documento)}
      titulo={t('documentos.metadados.titulo')}
      aoFechar={aoFechar}
      rodape={
        <>
          <Button type="button" variante="secundario" onClick={aoFechar}>{t('acoes.cancelar')}</Button>
          <Button type="submit" form="documento-metadados-form" disabled={salvando}>{t('acoes.salvar')}</Button>
        </>
      }
    >
      {erro ? <Alert tipo="erro">{erro.mensagem ?? t('erros.inesperado')}</Alert> : null}
      <p className="muted">{t('documentos.metadados.descricao')}</p>
      <form id="documento-metadados-form" className="form-grid" onSubmit={enviar}>
        <label className="field field--wide">
          <span>{t('documentos.metadados.arquivo')}</span>
          <input value={documento?.nomeOriginal ?? ''} disabled />
        </label>
        <label className="field">
          <span>{t('documentos.tipoDocumento')}</span>
          <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
            {tipos.map((item) => <option key={item} value={item}>{t(`documentos.tipos.${item}`)}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t('documentos.emitidoEm')}</span>
          <input type="date" value={emitidoEm} onChange={(event) => setEmitidoEm(event.target.value)} />
        </label>
        <label className="field">
          <span>{t('documentos.validoAte')}</span>
          <input type="date" value={validoAte} onChange={(event) => setValidoAte(event.target.value)} />
        </label>
      </form>
    </Modal>
  );
}
