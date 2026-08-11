import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { baixarArquivo, type ApiError } from '../../api/http';
import type { Documento } from '../../api/types';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import '../../styles/document-preview.css';

export function DocumentoPreviewModal({
  documento,
  aoFechar,
  aoBaixar,
}: {
  documento?: Documento;
  aoFechar: () => void;
  aoBaixar: (documento: Documento) => void;
}) {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string>();
  const [mimeType, setMimeType] = useState<string>();
  const [erro, setErro] = useState<ApiError>();
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!documento) {
      setUrl(undefined);
      setMimeType(undefined);
      setErro(undefined);
      return;
    }

    let ativo = true;
    let objectUrl: string | undefined;
    setCarregando(true);
    setErro(undefined);
    setUrl(undefined);
    void baixarArquivo(`/documentos/${documento.id}/preview`)
      .then((download) => {
        if (!ativo) return;
        objectUrl = URL.createObjectURL(download.blob);
        setUrl(objectUrl);
        setMimeType(download.blob.type || documento.mimeType);
      })
      .catch((exception) => {
        if (ativo) setErro(exception as ApiError);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documento]);

  return (
    <Modal
      aberto={Boolean(documento)}
      titulo={documento?.nomeOriginal ?? t('documentos.preview.titulo')}
      aoFechar={aoFechar}
      className="modal--document-preview"
      rodape={documento ? (
        <>
          <Button type="button" variante="secundario" onClick={aoFechar}>
            {t('acoes.fechar')}
          </Button>
          <Button type="button" onClick={() => aoBaixar(documento)}>
            {t('acoes.baixar')}
          </Button>
        </>
      ) : undefined}
    >
      {erro ? (
        <Alert tipo="erro">
          <strong>{erro.mensagem ?? t('erros.inesperado')}</strong>
          {erro.correlationId ? <small>{t('erros.correlationId', { valor: erro.correlationId })}</small> : null}
        </Alert>
      ) : null}
      {carregando ? <p className="muted">{t('documentos.preview.carregando')}</p> : null}
      {url && mimeType === 'application/pdf' ? (
        <object
          className="document-preview__pdf"
          data={url}
          type="application/pdf"
          aria-label={documento?.nomeOriginal}
        >
          <Alert tipo="info">{t('documentos.preview.pdfNaoSuportado')}</Alert>
        </object>
      ) : null}
      {url && (mimeType === 'image/png' || mimeType === 'image/jpeg') ? (
        <img
          className="document-preview__image"
          src={url}
          alt={documento?.nomeOriginal ?? t('documentos.preview.titulo')}
        />
      ) : null}
      {url ? <Alert tipo="info">{t('documentos.preview.integridade')}</Alert> : null}
    </Modal>
  );
}
