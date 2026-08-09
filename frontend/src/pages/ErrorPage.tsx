import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

export function ErrorPage({
  tipo,
}: {
  tipo: 'semPermissao' | 'autenticacao' | 'naoEncontrado';
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const mensagem =
    tipo === 'semPermissao'
      ? t('auth.semPermissao')
      : tipo === 'autenticacao'
        ? t('auth.erro')
        : t('erros.naoEncontrado');

  return (
    <main className="error-page">
      <div className="brand__mark">C</div>
      <h1>{mensagem}</h1>
      {location.state?.mensagem ? <p>{String(location.state.mensagem)}</p> : null}
      <Link className="button button--primario" to="/">
        {t('acoes.voltar')}
      </Link>
    </main>
  );
}
