import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Alert } from '../../components/Alert';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import '../../styles/document-retention.css';

export type DocumentoRetencaoPreviewData = {
  observadoEm: string;
  empresaId?: string;
  criterios: {
    diasInativo: number;
    diasAposValidade: number;
    diasSemValidade: number;
    maximoLinhas: number;
  };
  totalCandidatos: number;
  totalAnalisados: number;
  parcial: boolean;
  tamanhoAnalisadoBytes: number;
  porMotivo: Record<string, number>;
  itens: DocumentoRetencaoItem[];
};

type DocumentoRetencaoItem = {
  id: string;
  empresaId: string;
  tipo: string;
  nomeOriginal: string;
  mimeType: string;
  tamanhoBytes: number;
  origem: string;
  emitidoEm?: string;
  validoAte?: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  motivos: string[];
};

export function DocumentoRetencaoPreview({
  preview,
}: {
  preview: DocumentoRetencaoPreviewData;
}) {
  const { t } = useTranslation();

  return (
    <Card className="retention-preview">
      <div className="retention-preview__header">
        <div>
          <span className="eyebrow">{t('documentos.retencao.somenteLeitura')}</span>
          <h2>{t('documentos.retencao.titulo')}</h2>
          <p className="muted">{t('documentos.retencao.descricao')}</p>
        </div>
        <StatusBadge tom={preview.totalCandidatos > 0 ? 'aviso' : 'sucesso'}>
          {t('documentos.retencao.candidatos', { quantidade: preview.totalCandidatos })}
        </StatusBadge>
      </div>

      {preview.parcial ? (
        <Alert tipo="aviso">
          {t('documentos.retencao.parcial', {
            analisados: preview.totalAnalisados,
            total: preview.totalCandidatos,
          })}
        </Alert>
      ) : null}

      <div className="retention-preview__metrics">
        <div>
          <span>{t('documentos.retencao.totalAnalisados')}</span>
          <strong>{preview.totalAnalisados}</strong>
        </div>
        <div>
          <span>{t('documentos.retencao.tamanhoAnalisado')}</span>
          <strong>{formatarTamanho(preview.tamanhoAnalisadoBytes)}</strong>
        </div>
        <div>
          <span>{t('documentos.retencao.observadoEm')}</span>
          <strong>{formatarDataHora(preview.observadoEm)}</strong>
        </div>
      </div>

      <div className="retention-preview__criteria">
        <h3>{t('documentos.retencao.criteriosTitulo')}</h3>
        <ul>
          <li>{t('documentos.retencao.criterios.inativo', { dias: preview.criterios.diasInativo })}</li>
          <li>{t('documentos.retencao.criterios.expirado', { dias: preview.criterios.diasAposValidade })}</li>
          <li>{t('documentos.retencao.criterios.semValidade', { dias: preview.criterios.diasSemValidade })}</li>
        </ul>
      </div>

      {Object.keys(preview.porMotivo).length > 0 ? (
        <div className="retention-preview__reasons">
          {Object.entries(preview.porMotivo).map(([motivo, quantidade]) => (
            <StatusBadge key={motivo} tom="neutro">
              {motivoRetencao(t, motivo)}: {quantidade}
            </StatusBadge>
          ))}
        </div>
      ) : null}

      {preview.itens.length === 0 ? (
        <EmptyState
          titulo={t('documentos.retencao.vazio')}
          descricao={t('documentos.retencao.vazioDescricao')}
        />
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t('documentos.retencao.documento')}</th>
                <th>{t('comum.tipo')}</th>
                <th>{t('documentos.tamanho')}</th>
                <th>{t('documentos.validoAte')}</th>
                <th>{t('comum.status')}</th>
                <th>{t('documentos.retencao.motivo')}</th>
              </tr>
            </thead>
            <tbody>
              {preview.itens.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.nomeOriginal}</strong>
                    <span className="table-secondary">{formatarDataHora(item.criadoEm)}</span>
                  </td>
                  <td>{item.tipo}</td>
                  <td>{formatarTamanho(item.tamanhoBytes)}</td>
                  <td>{item.validoAte ? formatarData(item.validoAte) : t('comum.naoInformado')}</td>
                  <td>
                    <StatusBadge tom={item.ativo ? 'info' : 'neutro'}>
                      {t(item.ativo
                        ? 'documentos.retencao.ativo'
                        : 'documentos.retencao.inativo')}
                    </StatusBadge>
                  </td>
                  <td>
                    <div className="retention-preview__reason-list">
                      {item.motivos.map((motivo) => (
                        <span key={motivo}>{motivoRetencao(t, motivo)}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Alert tipo="info">{t('documentos.retencao.naoExecutaExclusao')}</Alert>
    </Card>
  );
}

function motivoRetencao(t: TFunction, motivo: string) {
  const key = `documentos.retencao.motivos.${motivo}`;
  const translated = t(key);
  return translated === key ? motivo : translated;
}

function formatarTamanho(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
  }
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(bytes / (1024 * 1024 * 1024))} GB`;
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`));
}

function formatarDataHora(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
