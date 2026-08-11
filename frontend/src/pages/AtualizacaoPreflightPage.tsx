import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { api, baixarArquivo, type ApiError } from '../api/http';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

type Ocorrencia = {
  nivel: 'ERRO' | 'AVISO';
  codigo: string;
  mensagem: string;
};

type Artefato = {
  componente: string;
  nomeArquivo?: string;
  tamanhoBytes: number;
  nomeSeguro: boolean;
  sha256Valido: boolean;
};

type PreflightResponse = {
  status: 'APROVADO' | 'REPROVADO';
  versaoAtual: string;
  versaoDestino?: string;
  versaoMinimaOrigem?: string;
  criadoEm?: string;
  quantidadeArtefatos: number;
  artefatos: Artefato[];
  ocorrencias: Ocorrencia[];
};

export function AtualizacaoPreflightPage() {
  const { t } = useTranslation();
  const [arquivo, setArquivo] = useState<File>();
  const [resultado, setResultado] = useState<PreflightResponse>();
  const [erro, setErro] = useState<ApiError>();
  const [analisando, setAnalisando] = useState(false);

  const analisar = async (event: FormEvent) => {
    event.preventDefault();
    if (!arquivo) return;
    setAnalisando(true);
    setErro(undefined);
    const body = new FormData();
    body.append('manifesto', arquivo);
    try {
      setResultado(await api<PreflightResponse>('/console-tecnica/atualizacoes/preflight', {
        method: 'POST',
        body,
      }));
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setAnalisando(false);
    }
  };

  const baixarModelo = async () => {
    try {
      const download = await baixarArquivo('/console-tecnica/atualizacoes/modelo');
      const url = URL.createObjectURL(download.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = download.nome ?? 'manifesto-atualizacao-modelo.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (exception) {
      setErro(exception as ApiError);
    }
  };

  return (
    <>
      <PageHeader
        titulo={t('atualizacaoPreflight.titulo')}
        descricao={t('atualizacaoPreflight.descricao')}
        acoes={
          <Button variante="secundario" onClick={() => void baixarModelo()}>
            {t('atualizacaoPreflight.baixarModelo')}
          </Button>
        }
      />

      {erro ? <Alert tipo="erro" onClose={() => setErro(undefined)}>{erro.mensagem ?? t('erros.inesperado')}</Alert> : null}

      <Alert tipo="aviso">{t('atualizacaoPreflight.somentePreflight')}</Alert>

      <Card titulo={t('atualizacaoPreflight.enviarTitulo')}>
        <form className="form-grid form-grid--compact" onSubmit={analisar}>
          <label className="field field--wide">
            <span>{t('atualizacaoPreflight.manifesto')}</span>
            <input
              type="file"
              accept="application/json,.json"
              required
              onChange={(event) => {
                setArquivo(event.target.files?.[0]);
                setResultado(undefined);
              }}
            />
          </label>
          <div className="form-actions field--wide">
            <Button type="submit" disabled={!arquivo || analisando}>
              {analisando ? t('atualizacaoPreflight.analisando') : t('atualizacaoPreflight.analisar')}
            </Button>
          </div>
        </form>
      </Card>

      {resultado ? (
        <>
          <div className="metric-grid">
            <Card className="metric-card">
              <span>{t('atualizacaoPreflight.resultado')}</span>
              <strong><StatusBadge tom={resultado.status === 'APROVADO' ? 'sucesso' : 'erro'}>{t(`atualizacaoPreflight.status.${resultado.status}`)}</StatusBadge></strong>
            </Card>
            <Card className="metric-card">
              <span>{t('atualizacaoPreflight.versaoAtual')}</span>
              <strong>{resultado.versaoAtual}</strong>
            </Card>
            <Card className="metric-card">
              <span>{t('atualizacaoPreflight.versaoDestino')}</span>
              <strong>{resultado.versaoDestino ?? '—'}</strong>
            </Card>
            <Card className="metric-card">
              <span>{t('atualizacaoPreflight.artefatos')}</span>
              <strong>{resultado.quantidadeArtefatos}</strong>
            </Card>
          </div>

          {resultado.ocorrencias.length > 0 ? (
            <div className="card-list">
              {resultado.ocorrencias.map((ocorrencia, indice) => (
                <Alert key={`${ocorrencia.codigo}-${indice}`} tipo={ocorrencia.nivel === 'ERRO' ? 'erro' : 'aviso'}>
                  <strong>{ocorrencia.codigo}</strong>
                  <span>{ocorrencia.mensagem}</span>
                </Alert>
              ))}
            </div>
          ) : (
            <Alert tipo="sucesso">{t('atualizacaoPreflight.semOcorrencias')}</Alert>
          )}

          {resultado.artefatos.length === 0 ? (
            <EmptyState titulo={t('atualizacaoPreflight.semArtefatos')} />
          ) : (
            <div className="table-card">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t('atualizacaoPreflight.componente')}</th>
                      <th>{t('atualizacaoPreflight.nomeArquivo')}</th>
                      <th>{t('atualizacaoPreflight.tamanho')}</th>
                      <th>{t('atualizacaoPreflight.nomeSeguro')}</th>
                      <th>{t('atualizacaoPreflight.shaValido')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.artefatos.map((item, indice) => (
                      <tr key={`${item.componente}-${item.nomeArquivo}-${indice}`}>
                        <td><code>{item.componente}</code></td>
                        <td>{item.nomeArquivo ?? '—'}</td>
                        <td>{formatarTamanho(item.tamanhoBytes)}</td>
                        <td><StatusBadge tom={item.nomeSeguro ? 'sucesso' : 'erro'}>{t(item.nomeSeguro ? 'comum.sim' : 'comum.nao')}</StatusBadge></td>
                        <td><StatusBadge tom={item.sha256Valido ? 'sucesso' : 'erro'}>{t(item.sha256Valido ? 'comum.sim' : 'comum.nao')}</StatusBadge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </>
  );
}

function formatarTamanho(bytes: number) {
  if (bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
