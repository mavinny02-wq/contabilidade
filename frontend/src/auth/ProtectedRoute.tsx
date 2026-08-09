import { useTranslation } from 'react-i18next';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LoadingScreen } from '../components/LoadingScreen';

export function ProtectedRoute() {
  const { t } = useTranslation();
  const { inicializado, autenticado } = useAuth();

  if (!inicializado) return <LoadingScreen mensagem={t('app.carregando')} />;
  if (!autenticado) return <Navigate to="/erro-autenticacao" replace />;
  return <Outlet />;
}
