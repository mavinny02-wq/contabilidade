import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { PermissionRoute } from '../auth/PermissionRoute';
import { PERMISSOES } from '../auth/permissoes';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { LoadingScreen } from '../components/LoadingScreen';
import { AppShell } from './AppShell';

const AgendaCertidoesPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.AgendaCertidoesPage })));
const AtualizacaoPreflightPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.AtualizacaoPreflightPage })));
const DashboardPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.DashboardPage })));
const EmpresasPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.EmpresasPage })));
const EmpresaDetalhePage = lazy(() => import('./routePages').then((pages) => ({ default: pages.EmpresaDetalhePage })));
const ResponsaveisModuloPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.ResponsaveisModuloPage })));
const DocumentosPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.DocumentosPage })));
const CertidoesPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.CertidoesPage })));
const ExecucoesPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.ExecucoesPage })));
const IntervencoesPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.IntervencoesPage })));
const NotificacoesPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.NotificacoesPage })));
const IntegracoesPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.IntegracoesPage })));
const HistoricoProvedoresPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.HistoricoProvedoresPage })));
const FaturasProvedoresPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.FaturasProvedoresPage })));
const AuditoriaPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.AuditoriaPage })));
const BackupsPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.BackupsPage })));
const ConfiguracaoSeguraPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.ConfiguracaoSeguraPage })));
const ConsoleTecnicaPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.ConsoleTecnicaPage })));
const HistoricoWorkersPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.HistoricoWorkersPage })));
const ErrorPage = lazy(() => import('./routePages').then((pages) => ({ default: pages.ErrorPage })));
type ChunkErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

class ChunkErrorBoundary extends Component<ChunkErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('route_chunk_load_failed', error, info.componentStack);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function RouteLoadingBoundary({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const failure = (
    <Alert tipo="erro">
      <span>{t('comum.erroCarregamento')}</span>
      <Button variante="secundario" onClick={() => window.location.reload()}>{t('acoes.atualizar')}</Button>
    </Alert>
  );

  return (
    <ChunkErrorBoundary fallback={failure}>
      <Suspense fallback={<LoadingScreen mensagem={t('app.carregando')} />}>
        {children}
      </Suspense>
    </ChunkErrorBoundary>
  );
}

function routePage(page: ReactNode) {
  return <RouteLoadingBoundary>{page}</RouteLoadingBoundary>;
}

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: routePage(<DashboardPage />) },
          {
            element: <PermissionRoute permissao={PERMISSOES.EMPRESA_LER} />,
            children: [
              { path: 'empresas', element: routePage(<EmpresasPage />) },
              { path: 'empresas/:id', element: routePage(<EmpresaDetalhePage />) },
              { path: 'empresas/:id/responsaveis-modulo', element: routePage(<ResponsaveisModuloPage />) },
            ],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.DOCUMENTO_LER} />,
            children: [{ path: 'documentos', element: routePage(<DocumentosPage />) }],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.CERTIDAO_LER} />,
            children: [
              { path: 'certidoes', element: routePage(<CertidoesPage />) },
              { path: 'certidoes/agenda', element: routePage(<AgendaCertidoesPage />) },
            ],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.EXECUCAO_LER} />,
            children: [{ path: 'execucoes', element: routePage(<ExecucoesPage />) }],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.INTERVENCAO_LER} />,
            children: [{ path: 'intervencoes', element: routePage(<IntervencoesPage />) }],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.NOTIFICACAO_LER} />,
            children: [{ path: 'notificacoes', element: routePage(<NotificacoesPage />) }],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.INTEGRACAO_LER} />,
            children: [
              { path: 'integracoes', element: routePage(<IntegracoesPage />) },
              { path: 'integracoes/historico-provedores', element: routePage(<HistoricoProvedoresPage />) },
              { path: 'integracoes/faturas', element: routePage(<FaturasProvedoresPage />) },
            ],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.AUDITORIA_LER} />,
            children: [{ path: 'auditoria', element: routePage(<AuditoriaPage />) }],
          },
          {
            element: <PermissionRoute permissao={PERMISSOES.CONSOLE_TECNICA_LER} />,
            children: [
              { path: 'console-tecnica', element: routePage(<ConsoleTecnicaPage />) },
              { path: 'console-tecnica/workers/historico', element: routePage(<HistoricoWorkersPage />) },
              { path: 'atualizacoes', element: routePage(<AtualizacaoPreflightPage />) },
              { path: 'backups', element: routePage(<BackupsPage />) },
              { path: 'configuracao-segura', element: routePage(<ConfiguracaoSeguraPage />) },
            ],
          },
        ],
      },
    ],
  },
  { path: '/sem-permissao', element: routePage(<ErrorPage tipo="semPermissao" />) },
  { path: '/erro-autenticacao', element: routePage(<ErrorPage tipo="autenticacao" />) },
  { path: '/404', element: routePage(<ErrorPage tipo="naoEncontrado" />) },
  { path: '*', element: <Navigate to="/404" replace /> },
]);
