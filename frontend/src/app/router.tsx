import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { PermissionRoute } from '../auth/PermissionRoute';
import { PERMISSOES } from '../auth/permissoes';
import { AppShell } from './AppShell';
import { AgendaCertidoesPage } from '../pages/AgendaCertidoesPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EmpresasPage } from '../pages/EmpresasPage';
import { EmpresaDetalhePage } from '../pages/EmpresaDetalhePage';
import { DocumentosPage } from '../pages/DocumentosPage';
import { CertidoesPage } from '../pages/CertidoesPage';
import { ExecucoesPage } from '../pages/ExecucoesPage';
import { IntervencoesPage } from '../pages/IntervencoesPage';
import { NotificacoesPage } from '../pages/NotificacoesPage';
import { IntegracoesPage } from '../pages/IntegracoesPage';
import { HistoricoProvedoresPage } from '../pages/HistoricoProvedoresPage';
import { AuditoriaPage } from '../pages/AuditoriaPage';
import { BackupsPage } from '../pages/BackupsPage';
import { ConsoleTecnicaPage } from '../pages/ConsoleTecnicaPage';
import { ErrorPage } from '../pages/ErrorPage';

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          {
            element: <PermissionRoute permissao={PERMISSOES.EMPRESA_LER} />,
            children: [
              { path: 'empresas', element: <EmpresasPage /> },
              { path: 'empresas/:id', element: <EmpresaDetalhePage /> },
            ],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.DOCUMENTO_LER} />,
            children: [{ path: 'documentos', element: <DocumentosPage /> }],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.CERTIDAO_LER} />,
            children: [
              { path: 'certidoes', element: <CertidoesPage /> },
              { path: 'certidoes/agenda', element: <AgendaCertidoesPage /> },
            ],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.EXECUCAO_LER} />,
            children: [{ path: 'execucoes', element: <ExecucoesPage /> }],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.INTERVENCAO_LER} />,
            children: [{ path: 'intervencoes', element: <IntervencoesPage /> }],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.NOTIFICACAO_LER} />,
            children: [{ path: 'notificacoes', element: <NotificacoesPage /> }],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.INTEGRACAO_LER} />,
            children: [
              { path: 'integracoes', element: <IntegracoesPage /> },
              { path: 'integracoes/historico-provedores', element: <HistoricoProvedoresPage /> },
            ],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.AUDITORIA_LER} />,
            children: [{ path: 'auditoria', element: <AuditoriaPage /> }],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.CONSOLE_TECNICA_LER} />,
            children: [
              { path: 'console-tecnica', element: <ConsoleTecnicaPage /> },
              { path: 'backups', element: <BackupsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '/sem-permissao', element: <ErrorPage tipo="semPermissao" /> },
  { path: '/erro-autenticacao', element: <ErrorPage tipo="autenticacao" /> },
  { path: '/404', element: <ErrorPage tipo="naoEncontrado" /> },
  { path: '*', element: <Navigate to="/404" replace /> },
]);
