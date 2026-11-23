import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { registrarExpiracaoSessao, tokenStorage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(tokenStorage.obter()));

  const sair = useCallback(() => {
    tokenStorage.remover();
    setUsuario(null);
  }, []);

  useEffect(() => {
    registrarExpiracaoSessao(sair);
    if (!tokenStorage.obter()) return;
    authApi.me()
      .then(setUsuario)
      .catch(sair)
      .finally(() => setCarregando(false));
  }, [sair]);

  const entrar = useCallback(async (email, senha) => {
    const { token, usuario: logado } = await authApi.login(email, senha);
    tokenStorage.salvar(token);
    setUsuario(logado);
    return logado;
  }, []);

  const valor = useMemo(() => ({ usuario, carregando, entrar, sair }), [usuario, carregando, entrar, sair]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export const ROTA_INICIAL = { PACIENTE: '/paciente', MEDICO: '/medico', RECEPCAO: '/recepcao' };
