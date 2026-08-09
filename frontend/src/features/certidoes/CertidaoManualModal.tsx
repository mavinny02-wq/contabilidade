import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../../api/http';
import type { Certidao, ResultadoCertidao } from '../../api/types';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

const resultados: ResultadoCertidao[] = [
  'REGULAR',
  'POSITIVA_COM_EFEITO_NEGATIVA',
  'IRREGULAR',
  'INCOMPLETA',
];

export function CertidaoManualModal({
  certidao,
  aberto,
  aoFechar,
  aoSalvar,
}: {
  certidao?: Certidao;
  aberto: boolean;
  aoFechar: () => void;
  aoSalvar: (certidao: Certidao) => void;
}) {
  const { t } = useTranslation();
  const [resultado, setResultado] = useState<ResultadoCertidao>('REGULAR');
  const [numero, setNumero] = useState('');
  const [emitidaEm, setEmitidaEm] = useState('');
  const [validaAte, setValidaAte] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [arquivo, setArquivo] = useState<File>();
  const [erro, setErro] = useState<ApiError>();
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setResultado(certidao?.resultado && certidao.resultado !== 'DESCONHECIDO'
      ? certidao.resultado
      : 'REGULAR');
    setNumero(certidao?.numeroCertidao ?? '');
    setEmitidaEm(certidao?.emitidaEm ?? '');
    setValidaAte(certidao?.validaAte ?? '');
    setMensagem(certidao?.mensagemFonte ?? '');
    setArquivo(undefined);
    setErro(undefined);
  }, [aberto, certidao]);

  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    if (!certidao) return;
    setSalvando(true);
    setErro(undefined);
    const body = new FormData();
    body.append('resultado', resultado);
    if (numero.trim()) body.append('numero', numero.trim());
    if (emitidaEm) body.append('emitidaEm', emitidaEm);
    if (validaAte) body.append('validaAte', validaAte);
    if (mensagem.trim()) body.append('mensagem', mensagem.trim());
    if (arquivo) body.append('arquivo', arquivo);

    try {
      const salva = await api<Certidao>(`/certidoes/${certidao.id}/resultado-manual`, {
        method: 'POST',
        body,
      });
      aoSalvar(salva);
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setSalvando(false);
    }
  };

  const arquivoObrigatorio = resultado !== 'INCOMPLETA';

  return (
    <Modal
      aberto={aberto}
      titulo={t('certidoes.manual.titulo')}
      aoFechar={aoFechar}
      rodape={
        <>
          <Button variante="secundario" type="button" onClick={aoFechar}>
            {t('acoes.cancelar')}
          </Button>
          <Button type="submit" form="certidao-manual-form" disabled={salvando}>
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
      {certidao ? (
        <div className="context-strip">
          <strong>{t(`certidoes.tipos.${certidao.tipo}`)}</strong>
          <span>{formatarCnpj(certidao.cnpj)}</span>
        </div>
      ) : null}
      <form id="certidao-manual-form" className="form-grid" onSubmit={enviar}>
        <label className="field">
          <span>{t('certidoes.campos.resultado')}</span>
          <select value={resultado} onChange={(event) => setResultado(event.target.value as ResultadoCertidao)}>
            {resultados.map((item) => (
              <option key={item} value={item}>{t(`certidoes.resultados.${item}`)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('certidoes.campos.numero')}</span>
          <input maxLength={200} value={numero} onChange={(event) => setNumero(event.target.value)} />
        </label>
        <label className="field">
          <span>{t('certidoes.campos.emitidaEm')}</span>
          <input type="date" value={emitidaEm} onChange={(event) => setEmitidaEm(event.target.value)} />
        </label>
        <label className="field">
          <span>{t('certidoes.campos.validaAte')}</span>
          <input type="date" value={validaAte} onChange={(event) => setValidaAte(event.target.value)} />
        </label>
        <label className="field field--wide">
          <span>{t('certidoes.campos.mensagemFonte')}</span>
          <textarea rows={3} maxLength={1000} value={mensagem} onChange={(event) => setMensagem(event.target.value)} />
        </label>
        <label className="field field--wide">
          <span>{t('certidoes.manual.documento')}</span>
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            required={arquivoObrigatorio}
            onChange={(event) => setArquivo(event.target.files?.[0])}
          />
          <small className="field__help">
            {arquivoObrigatorio
              ? t('certidoes.manual.documentoObrigatorio')
              : t('certidoes.manual.documentoOpcional')}
          </small>
        </label>
      </form>
    </Modal>
  );
}

function formatarCnpj(cnpj: string) {
  return cnpj.length === 14
    ? cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    : cnpj;
}
