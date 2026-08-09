import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';

export default function App() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('app.nome');
  }, [t]);

  return <RouterProvider router={router} />;
}
