import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/http';
import type { EventoAuditoria, Pagina } from '../api/types';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function AuditoriaPage() {
  const { t } = useTranslation();
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    void api<Pagina<EventoAuditoria>>('/auditoria?pagina=0&tamanho=100')
      .then((response) => setEventos(response.content))
      .catch(() => setErro(true));
  }, []);

  return (
    <>
      <PageHeader titulo={t('auditoria.titulo')} descricao={t('auditoria.descricao')} />
      {erro ? <Alert tipo="erro">{t('comum.erroCarregamento')}</Alert> : null}
      {eventos.length === 0 ? (
        <EmptyState titulo={t('auditoria.listaVazia')} />
      ) : (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('comum.data')}</th>
                  <th>{t('auditoria.acao')}</th>
                  <th>{t('auditoria.recurso')}</th>
                  <th>{t('auditoria.ator')}</th>
                  <th>{t('auditoria.correlationId')}</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => (
                  <tr key={evento.id}>
                    <td>{formatarData(evento.criadoEm)}</td>
                    <td>{evento.acao}</td>
                    <td>{evento.recursoTipo}{evento.recursoId ? ` · ${evento.recursoId}` : ''}</td>
                    <td>{evento.ator}</td>
                    <td><code>{evento.correlationId ?? t('comum.naoInformado')}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
