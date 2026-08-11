import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { PERMISSOES } from '../auth/permissoes';
import { GlobalSearch } from './GlobalSearch';

type NavItem = {
  to: string;
  labelKey: string;
  sigla: string;
  permissao?: string;
  grupo?: string;
};

const items: NavItem[] = [
  { to: '/', labelKey: 'menu.visaoGeral', sigla: 'V' },
  { to: '/empresas', labelKey: 'menu.empresas', sigla: 'E', permissao: PERMISSOES.EMPRESA_LER },
  { to: '/certidoes', labelKey: 'menu.certidoes', sigla: 'C', permissao: PERMISSOES.CERTIDAO_LER, grupo: 'menu.fiscal' },
  { to: '/documentos', labelKey: 'menu.documentos', sigla: 'D', permissao: PERMISSOES.DOCUMENTO_LER, grupo: 'menu.fiscal' },
  { to: '/execucoes', labelKey: 'menu.execucoes', sigla: 'X', permissao: PERMISSOES.EXECUCAO_LER, grupo: 'menu.operacao' },
  { to: '/intervencoes', labelKey: 'menu.intervencoes', sigla: 'I', permissao: PERMISSOES.INTERVENCAO_LER, grupo: 'menu.operacao' },
  { to: '/notificacoes', labelKey: 'menu.notificacoes', sigla: 'N', permissao: PERMISSOES.NOTIFICACAO_LER },
  { to: '/integracoes', labelKey: 'menu.integracoes', sigla: 'P', permissao: PERMISSOES.INTEGRACAO_LER, grupo: 'menu.administracao' },
  { to: '/integracoes/historico-provedores', labelKey: 'menu.historicoProvedores', sigla: 'H', permissao: PERMISSOES.INTEGRACAO_LER, grupo: 'menu.administracao' },
  { to: '/auditoria', labelKey: 'menu.auditoria', sigla: 'A', permissao: PERMISSOES.AUDITORIA_LER, grupo: 'menu.administracao' },
  { to: '/backups', labelKey: 'menu.backups', sigla: 'B', permissao: PERMISSOES.CONSOLE_TECNICA_LER, grupo: 'menu.administracao' },
  { to: '/console-tecnica', labelKey: 'menu.consoleTecnica', sigla: 'T', permissao: PERMISSOES.CONSOLE_TECNICA_LER, grupo: 'menu.administracao' },
];

export function AppShell() {
  const { t } = useTranslation();
  const { usuario, temPermissao, sair } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  const visiveis = items.filter((item) => !item.permissao || temPermissao(item.permissao));
  let grupoAtual: string | undefined;

  return (
    <div className="app-layout">
      <aside className={`sidebar ${menuAberto ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <div className="brand__mark">C</div>
          <div>
            <strong>{t('app.nome')}</strong>
            <span>{t('app.subtitulo')}</span>
          </div>
        </div>
        <nav className="sidebar__nav">
          {visiveis.map((item) => {
            const mostrarGrupo = item.grupo && item.grupo !== grupoAtual;
            grupoAtual = item.grupo;
            return (
              <div key={item.to}>
                {mostrarGrupo ? <p className="sidebar__group">{t(item.grupo!)}</p> : null}
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMenuAberto(false)}
                  className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                >
                  <span className="sidebar__icon" aria-hidden="true">{item.sigla}</span>
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              </div>
            );
          })}
        </nav>
      </aside>

      {menuAberto ? <button className="sidebar-overlay" onClick={() => setMenuAberto(false)} aria-label={t('acoes.fechar')} /> : null}

      <div className="app-main">
        <header className="topbar">
          <button
            type="button"
            className="topbar__menu"
            onClick={() => setMenuAberto((value) => !value)}
            aria-label={t('menu.visaoGeral')}
          >
            ☰
          </button>
          <GlobalSearch />
          <div className="topbar__user">
            <div>
              <strong>{usuario?.nome ?? t('app.usuarioLocal')}</strong>
              {!usuario?.autenticacaoAtiva ? <span>{t('app.ambienteLocal')}</span> : null}
            </div>
            {usuario?.autenticacaoAtiva ? (
              <button type="button" className="button button--texto" onClick={sair}>
                {t('app.sair')}
              </button>
            ) : null}
          </div>
        </header>
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
