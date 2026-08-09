import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, baixarArquivo, type ApiError } from '../../api/http';
import type { Certidao, HistoricoCertidao, Pagina } from '../../api/types';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';

export function CertidaoHistoryModal({
  certidao,
  aberto,
  aoFechar,
}: {
  certidao?: Certidao;
  aberto: boolean;
  aoFechar: () => void;
}) {
  const { t } = useTranslation();
  const [itens, setItens] = useState<HistoricoCertidao[]>([]);
  const [erro, setErro] = useState<ApiError>();
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!aberto || !certidao) return;
    setCarregando(true);
    setErro(undefined);
    void api<Pagina<HistoricoCertidao>>(`/certidoes/${certidao.id}/historico?pagina=0&tamanho=100`)
      .then((response) => setItens(response.content))
      .catch((exception) => setErro(exception as ApiError))
      .finally(() => setCarregando(false));
  }, [aberto, certidao]);

  const baixar = async (item: HistoricoCertidao) => {
    if (!item.documentoId) return;
    try {
      const download = await baixarArquivo(`/documentos/${item.documentoId}/conteudo`);
      const url = URL.createObjectURL(download.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = download.nome ?? `certidao-${item.tipo}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (exception) {
      setErro(exception as ApiError);
    }
  };

  return (
    <Modal
      aberto={aberto}
      titulo={t('certidoes.historico.titulo')}
      aoFechar={aoFechar}
      rodape={<Button variante="secundario" onClick={aoFechar}>{t('acoes.fechar')}</Button>}
    >
      {erro ? <Alert tipo="erro">{erro.mensagem ?? t('erros.inesperado')}</Alert> : null}
      {carregando ? <p className="muted">{t('app.carregando')}</p> : null}
      {!carregando && itens.length === 0 ? (
        <EmptyState titulo={t('certidoes.historico.vazio')} />
      ) : (
        <div className="timeline">
          {itens.map((item) => (
            <article key={item.id} className="timeline__item">
              <div className="timeline__marker" aria-hidden="true" />
              <div className="timeline__content">
                <div className="card-row__title">
                  <strong>{formatarDataHora(item.observadaEm)}</strong>
                  <StatusBadge tom={tomResultado(item.resultado)}>
                    {t(`certidoes.resultados.${item.resultado}`)}
                  </StatusBadge>
                </div>
                <dl className="definition-list definition-list--compact">
                  <div><dt>{t('certidoes.campos.provedor')}</dt><dd>{item.provedorCodigo ?? t('comum.naoInformado')}</dd></div>
                  <div><dt>{t('certidoes.campos.numero')}</dt><dd>{item.numeroCertidao ?? t('comum.naoInformado')}</dd></div>
                  <div><dt>{t('certidoes.campos.validaAte')}</dt><dd>{item.validaAte ? formatarData(item.validaAte) : t('comum.naoInformado')}</dd></div>
                </dl>
                {item.mensagemFonte ? <p className="muted">{item.mensagemFonte}</p> : null}
                {item.documentoId ? (
                  <Button variante="texto" onClick={() => void baixar(item)}>{t('acoes.baixar')}</Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </Modal>
  );
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`));
}

function formatarDataHora(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function tomResultado(resultado: string): 'sucesso' | 'aviso' | 'erro' | 'info' | 'neutro' {
  if (resultado === 'REGULAR') return 'sucesso';
  if (resultado === 'IRREGULAR') return 'erro';
  if (resultado === 'POSITIVA_COM_EFEITO_NEGATIVA' || resultado === 'INCOMPLETA') return 'aviso';
  return 'neutro';
}
