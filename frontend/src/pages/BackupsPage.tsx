import { useCallback, useEffect, useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../api/http';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import '../styles/backups.css';

type StatusBackup = 'SAUDAVEL' | 'DEGRADADO' | 'INDISPONIVEL';

type ComponenteBackup = {
  nome: string;
  formato: string;
  tamanhoManifesto: number;
  tamanhoAtual?: number;
  existente: boolean;
  tamanhoConfere: boolean;
  hashConfere?: boolean;
  motivoSeguro?: string;
};

type BackupResumo = {
  backupId: string;
  criadoEm?: string;
  versaoAplicacao?: string;
  versaoSchema?: string;
  status: StatusBackup;
  motivoSeguro?: string;
  tamanhoTotalManifesto: number;
  tamanhoTotalAtual: number;
  integridadeVerificada: boolean;
  componentes: ComponenteBackup[];
};

type InventarioBackups = {
  observadoEm: string;
  diretorioDisponivel: boolean;
  motivoSeguro?: string;
  totalManifestos: number;
  listaLimitada: boolean;
  backups: BackupResumo[];
};

export function BackupsPage() {
  const { t } = useTranslation();
  const [inventario, setInventario] = useState<InventarioBackups>();
  const [erro, setErro] = useState<ApiError>();
  const [carregando, setCarregando] = useState(false);
  const [verificando, setVerificando] = useState<Set<string>>(new Set());
  const [mensagem, setMensagem] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(undefined);
    try {
      setInventario(await api<InventarioBackups>('/console-tecnica/backups'));
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const verificar = async (backupId: string) => {
    setVerificando((atuais) => new Set(atuais).add(backupId));
    setErro(undefined);
    setMensagem('');
    try {
      const resultado = await api<BackupResumo>(
        `/console-tecnica/backups/${encodeURIComponent(backupId)}/verificar`,
      );
      setInventario((atual) => atual ? {
        ...atual,
        backups: atual.backups.map((item) => item.backupId === backupId ? resultado : item),
      } : atual);
      setMensagem(resultado.integridadeVerificada
        ? t('backups.mensagens.integridadeConfirmada', { backupId })
        : t('backups.mensagens.verificacaoComPendencias', { backupId }));
    } catch (exception) {
      setErro(exception as ApiError);
    } finally {
      setVerificando((atuais) => {
        const proximo = new Set(atuais);
        proximo.delete(backupId);
        return proximo;
      });
    }
  };

  return (
    <>
      <PageHeader
        titulo={t('backups.titulo')}
        descricao={t('backups.descricao')}
        acoes={
          <Button variante="secundario" disabled={carregando} onClick={() => void carregar()}>
            {t('acoes.atualizar')}
          </Button>
        }
      />
      {mensagem ? <Alert tipo="sucesso" onClose={() => setMensagem('')}>{mensagem}</Alert> : null}
      {erro ? (
        <Alert tipo="erro" onClose={() => setErro(undefined)}>
          <strong>{erro.mensagem ?? t('comum.erroCarregamento')}</strong>
          {erro.correlationId ? <small>{t('erros.correlationId', { valor: erro.correlationId })}</small> : null}
        </Alert>
      ) : null}
      {inventario && !inventario.diretorioDisponivel ? (
        <Alert tipo="aviso">{motivo(t, inventario.motivoSeguro)}</Alert>
      ) : null}
      {inventario?.listaLimitada ? (
        <Alert tipo="info">{t('backups.listaLimitada', { quantidade: inventario.backups.length })}</Alert>
      ) : null}

      {inventario ? (
        <div className="metric-grid">
          <Card className="metric-card">
            <span>{t('backups.totalManifestos')}</span>
            <strong>{inventario.totalManifestos}</strong>
          </Card>
          <Card className="metric-card">
            <span>{t('backups.listados')}</span>
            <strong>{inventario.backups.length}</strong>
          </Card>
          <Card className="metric-card">
            <span>{t('backups.observadoEm')}</span>
            <strong className="backup-metric-date">{formatarData(inventario.observadoEm)}</strong>
          </Card>
        </div>
      ) : null}

      {!carregando && inventario?.diretorioDisponivel && inventario.backups.length === 0 ? (
        <EmptyState titulo={t('backups.vazio')} descricao={t('backups.vazioDescricao')} />
      ) : null}

      <div className="backup-list">
        {inventario?.backups.map((backup) => (
          <Card key={backup.backupId} className="backup-card">
            <div className="backup-card__header">
              <div>
                <span className="eyebrow">{t('backups.identificador')}</span>
                <h2>{backup.backupId}</h2>
                <p className="muted">
                  {backup.criadoEm ? formatarData(backup.criadoEm) : t('comum.naoInformado')}
                  {' · '}
                  {t('backups.versao')}: {backup.versaoAplicacao ?? t('comum.naoInformado')}
                </p>
              </div>
              <div className="backup-card__status">
                <Status status={backup.status} />
                <StatusBadge tom={backup.integridadeVerificada ? 'sucesso' : 'neutro'}>
                  {t(backup.integridadeVerificada
                    ? 'backups.integridadeVerificada'
                    : 'backups.integridadeNaoVerificada')}
                </StatusBadge>
              </div>
            </div>

            {backup.motivoSeguro ? (
              <Alert tipo={backup.status === 'INDISPONIVEL' ? 'erro' : 'aviso'}>
                {motivo(t, backup.motivoSeguro)}
              </Alert>
            ) : null}

            <div className="backup-summary">
              <div><span>{t('backups.tamanhoManifesto')}</span><strong>{formatarBytes(backup.tamanhoTotalManifesto)}</strong></div>
              <div><span>{t('backups.tamanhoAtual')}</span><strong>{formatarBytes(backup.tamanhoTotalAtual)}</strong></div>
              <div><span>{t('backups.componentes')}</span><strong>{backup.componentes.length}</strong></div>
            </div>

            {backup.componentes.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t('backups.componente')}</th>
                      <th>{t('backups.formato')}</th>
                      <th>{t('backups.tamanhoEsperado')}</th>
                      <th>{t('backups.tamanhoEncontrado')}</th>
                      <th>{t('backups.verificacao')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backup.componentes.map((componente) => (
                      <tr key={componente.nome}>
                        <td><strong>{componente.nome}</strong></td>
                        <td>{componente.formato}</td>
                        <td>{formatarBytes(componente.tamanhoManifesto)}</td>
                        <td>{componente.tamanhoAtual == null ? t('comum.naoInformado') : formatarBytes(componente.tamanhoAtual)}</td>
                        <td>
                          <StatusBadge tom={tomComponente(componente)}>
                            {textoComponente(t, componente)}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="form-actions">
              <Button
                variante="secundario"
                disabled={verificando.has(backup.backupId) || backup.status === 'INDISPONIVEL'}
                onClick={() => void verificar(backup.backupId)}
              >
                {verificando.has(backup.backupId)
                  ? t('backups.verificando')
                  : t('backups.verificarIntegridade')}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function Status({ status }: { status: StatusBackup }) {
  const { t } = useTranslation();
  const tom = status === 'SAUDAVEL' ? 'sucesso' : status === 'DEGRADADO' ? 'aviso' : 'erro';
  return <StatusBadge tom={tom}>{t(`backups.status.${status}`)}</StatusBadge>;
}

function tomComponente(componente: ComponenteBackup): 'sucesso' | 'aviso' | 'erro' | 'neutro' {
  if (!componente.existente) return 'erro';
  if (!componente.tamanhoConfere || componente.hashConfere === false) return 'erro';
  if (componente.hashConfere === true) return 'sucesso';
  return 'neutro';
}

function textoComponente(t: TFunction, componente: ComponenteBackup) {
  if (!componente.existente) return t('backups.componenteStatus.ausente');
  if (!componente.tamanhoConfere) return t('backups.componenteStatus.tamanhoDivergente');
  if (componente.hashConfere === false) return t('backups.componenteStatus.hashDivergente');
  if (componente.hashConfere === true) return t('backups.componenteStatus.hashConfirmado');
  return t('backups.componenteStatus.metadadosConferidos');
}

function motivo(t: TFunction, codigo?: string) {
  if (!codigo) return t('comum.naoInformado');
  const chave = `backups.motivos.${codigo}`;
  const traduzido = t(chave);
  return traduzido === chave ? codigo : traduzido;
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatarBytes(value: number) {
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value < 1024) return `${value} B`;
  const unidades = ['KB', 'MB', 'GB', 'TB'];
  let atual = value / 1024;
  let unidade = 0;
  while (atual >= 1024 && unidade < unidades.length - 1) {
    atual /= 1024;
    unidade++;
  }
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(atual)} ${unidades[unidade]}`;
}
