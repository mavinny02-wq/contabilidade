export type UsuarioAtual = {
  usuario: string;
  nome: string;
  papeis: string[];
  permissoes: string[];
  autenticacaoAtiva: boolean;
};

export type AuthContextValue = {
  inicializado: boolean;
  autenticado: boolean;
  token?: string;
  usuario?: UsuarioAtual;
  temPermissao: (permissao: string) => boolean;
  sair: () => void;
};
