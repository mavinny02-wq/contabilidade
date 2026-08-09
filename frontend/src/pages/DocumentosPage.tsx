import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { api, baixarArquivo, type ApiError } from '../api/http';
import type { Documento, EmpresaResumo, Pagina } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function DocumentosPage() {
  const { t } = useTranslation();
  const { temPermissao } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [empresas, setEmpresas] = useState<EmpresaResumo[]>([]);
  const [empresaId, setEmpresaId] = useState(searchParams.get('empresaId') ?? '');
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [tipo, setTipo] = useState('OUTRO');
  const [emitidoEm, setEmitidoEm] = useState('');
  const [validoAte, setValidoAte] = useState('');
  const [arquivo, setArquivo] = useState<File>();
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState<ApiError>();
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void api<Pagina<EmpresaResumo>>('/empresas?pagina=0&tamanho=100&termo=')
      .then((response) => setEmpresas(response.content))
      .catch((exception) => setErro(exception as ApiError));
  }, []);

  const carregar = useCallback(() => {
    if (!empresaId) {
      setDocumentos([]);
      return;
    }
    void api<Pagina<Documento>>(`/documentos?empresaId=${empresaId}&pagina=0&tamanho=100`)
      .then((response) => setDocumentos(response.content))
      .catch((exception) => setErro(exception as ApiError));
  }, [empresaId]);

  useEffect(carregar, [carregar]);

  const selecionarEmpresa = (id: string) => {
    setEmpresaId(id);
    if (id) setSearchParams({ empresaId: id });
    else setSearchParams({});
  };

  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    if (!empresaId || !arquivo) return;
    setEnviando(true);
    setErro(undefined);
    const body = new FormData();
    body.append('empresaId', empresaId);
    body.append('tipo', tipo);
    body.append('arquivo', arquivo);
    if (emitidoEm) body.append('emitidoEm', emitidoEm);
    if (validoAte) body.append('validoAte', validoAte);
    try {
      await api<Documento>('/documentos', { method: 'POST', body });
      setArquivo(undefined);
      setEmitidoEm('');
      setValidoAte('');
      setMensagem(t('documentos.mensagemEnviado'));
      carregar();
      const input = document.getElementById('documento-arquivo') as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setEnviando(false);
    }
  };

  const baixar = async (documento: Documento) => {
    try {
      const download = await baixarArquivo(`/documentos/${documento.id}/conteudo`);
      const url = URL.createObjectURL(download.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = download.nome ?? documento.nomeOriginal;
      link.click();
      URL.revokeObjectURL(url);
    } catch (exception) {
      setErro(exception as ApiError);
    }
  };

  return (
    <>
      <PageHeader titulo={t('documentos.titulo')} descricao={t('documentos.descricao')} />
      {mensagem ? <Alert tipo="sucesso" onClose={() => setMensagem('')}>{mensagem}</Alert> : null}
      {erro ? (
        <Alert tipo="erro" onClose={() => setErro(undefined)}>
          {erro.mensagem ?? t('erros.inesperado')}
        </Alert>
      ) : null}

      <Card>
        <label className="field">
          <span>{t('documentos.selecionarEmpresa')}</span>
          <select value={empresaId} onChange={(event) => selecionarEmpresa(event.target.value)}>
            <option value="">{t('documentos.selecionarEmpresa')}</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>{empresa.razaoSocial}</option>
            ))}
          </select>
        </label>
      </Card>

      {empresaId && temPermissao(PERMISSOES.DOCUMENTO_ENVIAR) ? (
        <Card titulo={t('documentos.enviarTitulo')}>
          <form className="form-grid form-grid--compact" onSubmit={enviar}>
            <label className="field">
              <span>{t('documentos.tipoDocumento')}</span>
              <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
                {['OUTRO', 'CERTIDAO', 'GUIA', 'COMPROVANTE', 'DECLARACAO', 'PROTOCOLO'].map((value) => (
                  <option key={value} value={value}>{t(`documentos.tipos.${value}`)}</option>
                ))}
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
            <label className="field field--wide">
              <span>{t('documentos.selecionarArquivo')}</span>
              <input id="documento-arquivo" type="file" required onChange={(event) => setArquivo(event.target.files?.[0])} />
            </label>
            <div className="form-actions field--wide">
              <Button type="submit" disabled={!arquivo || enviando}>{t('acoes.enviar')}</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {empresaId ? (
        documentos.length === 0 ? (
          <EmptyState titulo={t('documentos.listaVazia')} />
        ) : (
          <div className="table-card">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t('comum.tipo')}</th>
                    <th>{t('documentos.selecionarArquivo')}</th>
                    <th>{t('documentos.tamanho')}</th>
                    <th>{t('documentos.validoAte')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((documento) => (
                    <tr key={documento.id}>
                      <td>{documento.tipo}</td>
                      <td>
                        <strong>{documento.nomeOriginal}</strong>
                        <span className="table-secondary">{formatarData(documento.criadoEm)}</span>
                      </td>
                      <td>{formatarTamanho(documento.tamanhoBytes)}</td>
                      <td>{documento.validoAte ? formatarData(documento.validoAte) : t('comum.naoInformado')}</td>
                      <td className="table-actions">
                        {temPermissao(PERMISSOES.DOCUMENTO_BAIXAR) ? (
                          <Button variante="texto" onClick={() => void baixar(documento)}>{t('acoes.baixar')}</Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : null}
    </>
  );
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}
