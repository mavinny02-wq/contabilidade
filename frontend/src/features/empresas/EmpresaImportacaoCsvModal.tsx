import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { api, baixarArquivo, type ApiError } from '../../api/http';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

type ErroLinha = {
  linha: number;
  codigo: string;
  mensagem: string;
};

type ResultadoImportacao = {
  somenteValidacao: boolean;
  totalLinhas: number;
  linhasValidas: number;
  empresasImportadas: number;
  linhasRejeitadas: number;
  errosTruncados: boolean;
  erros: ErroLinha[];
};

export function EmpresaImportacaoCsvModal({
  aberto,
  aoFechar,
  aoImportar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoImportar: (quantidade: number) => void;
}) {
  const { t } = useTranslation();
  const [arquivo, setArquivo] = useState<File>();
  const [somenteValidar, setSomenteValidar] = useState(true);
  const [resultado, setResultado] = useState<ResultadoImportacao>();
  const [erro, setErro] = useState<ApiError>();
  const [processando, setProcessando] = useState(false);
  const [baixandoModelo, setBaixandoModelo] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setArquivo(undefined);
    setSomenteValidar(true);
    setResultado(undefined);
    setErro(undefined);
  }, [aberto]);

  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    if (!arquivo) return;
    setProcessando(true);
    setErro(undefined);
    setResultado(undefined);
    try {
      const form = new FormData();
      form.append('arquivo', arquivo);
      form.append('somenteValidar', String(somenteValidar));
      const resposta = await api<ResultadoImportacao>('/empresas/importacao-csv', {
        method: 'POST',
        body: form,
      });
      setResultado(resposta);
      if (!somenteValidar && resposta.empresasImportadas > 0) {
        aoImportar(resposta.empresasImportadas);
      }
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setProcessando(false);
    }
  };

  const baixarModelo = async () => {
    setBaixandoModelo(true);
    setErro(undefined);
    try {
      const download = await baixarArquivo('/empresas/importacao-csv/modelo');
      const url = URL.createObjectURL(download.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = download.nome ?? 'modelo-importacao-empresas.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setBaixandoModelo(false);
    }
  };

  return (
    <Modal
      aberto={aberto}
      titulo={t('empresas.importacao.titulo')}
      aoFechar={aoFechar}
      rodape={
        <>
          <Button type="button" variante="secundario" onClick={aoFechar}>
            {t('acoes.fechar')}
          </Button>
          <Button
            type="submit"
            form="empresa-importacao-csv-form"
            disabled={!arquivo || processando}
          >
            {t(somenteValidar
              ? 'empresas.importacao.validar'
              : 'empresas.importacao.importar')}
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

      <form id="empresa-importacao-csv-form" className="stack" onSubmit={enviar}>
        <p className="muted">{t('empresas.importacao.descricao')}</p>
        <div>
          <Button
            type="button"
            variante="texto"
            disabled={baixandoModelo}
            onClick={() => void baixarModelo()}
          >
            {t('empresas.importacao.baixarModelo')}
          </Button>
        </div>
        <label className="field">
          <span>{t('empresas.importacao.arquivo')}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            required
            onChange={(event) => {
              setArquivo(event.target.files?.[0]);
              setResultado(undefined);
            }}
          />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={somenteValidar}
            onChange={(event) => {
              setSomenteValidar(event.target.checked);
              setResultado(undefined);
            }}
          />
          <span>{t('empresas.importacao.somenteValidar')}</span>
        </label>
      </form>

      {resultado ? (
        <div className="stack">
          <Alert tipo={resultado.linhasRejeitadas > 0 ? 'aviso' : 'sucesso'}>
            <strong>{t(resultado.somenteValidacao
              ? 'empresas.importacao.validacaoConcluida'
              : 'empresas.importacao.importacaoConcluida')}</strong>
          </Alert>
          <dl className="definition-list definition-list--compact">
            <div><dt>{t('empresas.importacao.total')}</dt><dd>{resultado.totalLinhas}</dd></div>
            <div><dt>{t('empresas.importacao.validas')}</dt><dd>{resultado.linhasValidas}</dd></div>
            <div><dt>{t('empresas.importacao.importadas')}</dt><dd>{resultado.empresasImportadas}</dd></div>
            <div><dt>{t('empresas.importacao.rejeitadas')}</dt><dd>{resultado.linhasRejeitadas}</dd></div>
          </dl>
          {resultado.erros.length > 0 ? (
            <div className="table-card">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t('empresas.importacao.linha')}</th>
                      <th>{t('empresas.importacao.codigo')}</th>
                      <th>{t('empresas.importacao.motivo')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.erros.map((item, indice) => (
                      <tr key={`${item.linha}-${item.codigo}-${indice}`}>
                        <td>{item.linha}</td>
                        <td>{item.codigo}</td>
                        <td>{item.mensagem}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          {resultado.errosTruncados ? (
            <p className="muted">{t('empresas.importacao.errosTruncados')}</p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
