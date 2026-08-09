import Keycloak from 'keycloak-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api, definirTokenProvider } from '../api/http';
import { runtimeConfig } from '../config/runtime';
import type { AuthContextValue, UsuarioAtual } from './types';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [inicializado, setInicializado] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioAtual>();
  const keycloakRef = useRef<Keycloak | undefined>(undefined);

  useEffect(() => {
    let ativo = true;
    let refreshTimer: number | undefined;

    const carregarUsuario = async () => {
      const atual = await api<UsuarioAtual>('/usuario-atual');
      if (ativo) setUsuario(atual);
    };

    const iniciar = async () => {
      if (!runtimeConfig.authEnabled) {
        definirTokenProvider(() => undefined);
        await carregarUsuario();
        if (ativo) {
          setAutenticado(true);
          setInicializado(true);
        }
        return;
      }

      const keycloak = new Keycloak({
        url: runtimeConfig.keycloakUrl,
        realm: runtimeConfig.keycloakRealm,
        clientId: runtimeConfig.keycloakClientId,
      });
      keycloakRef.current = keycloak;
      const autenticou = await keycloak.init({
        onLoad: 'login-required',
        checkLoginIframe: false,
        pkceMethod: 'S256',
      });

      definirTokenProvider(() => keycloak.token);
      if (ativo) setAutenticado(autenticou);

      if (autenticou) {
        await carregarUsuario();
        refreshTimer = window.setInterval(() => {
          void keycloak.updateToken(60).catch(() => keycloak.login());
        }, 30_000);
      }

      if (ativo) setInicializado(true);
    };

    void iniciar().catch(() => {
      if (ativo) {
        setAutenticado(false);
        setInicializado(true);
      }
    });

    return () => {
      ativo = false;
      if (refreshTimer) window.clearInterval(refreshTimer);
    };
  }, []);

  const sair = useCallback(() => {
    if (runtimeConfig.authEnabled && keycloakRef.current) {
      void keycloakRef.current.logout({ redirectUri: window.location.origin });
    }
  }, []);

  const temPermissao = useCallback(
    (permissao: string) => usuario?.permissoes.includes(permissao) ?? false,
    [usuario],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      inicializado,
      autenticado,
      token: keycloakRef.current?.token,
      usuario,
      temPermissao,
      sair,
    }),
    [autenticado, inicializado, sair, temPermissao, usuario],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider ausente');
  return context;
}
