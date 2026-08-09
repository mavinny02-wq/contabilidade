import { useTranslation } from 'react-i18next';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export function PermissionRoute({ permissao }: { permissao: string }) {
  const { t } = useTranslation();
  const { temPermissao } = useAuth();

  if (!temPermissao(permissao)) {
    return <Navigate to="/sem-permissao" replace state={{ mensagem: t('auth.semPermissao') }} />;
  }
  return <Outlet />;
}
