import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-context';
import { authService } from '../services/auth.service';
import { registerUnauthorizedHandler } from '../services/http';
import {
  clearSession,
  getStoredUser,
  getToken,
  saveSession,
} from '../services/session';
import type { LoginInput, RegisterInput, User } from '../types';

/**
 * Guarda o estado de autenticação da aplicação inteira.
 * O token vai para o localStorage (sessão sobrevive ao F5) e é revalidado
 * na API a cada carregamento, para um token expirado não enganar a interface.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(() => Boolean(getToken()));

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // Sessão expirada no meio do uso (401 vindo da API) também derruba o login.
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearSession();
      setUser(null);
    });
  }, []);

  // Revalida o token guardado assim que o app abre.
  useEffect(() => {
    // Sem token guardado não há o que revalidar (loading já nasce false).
    if (!getToken()) {
      return;
    }

    const controller = new AbortController();

    authService
      .me(controller.signal)
      .then((profile) => setUser(profile))
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // Token inválido/expirado: limpa para não deixar a sessão "fantasma".
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const login = useCallback(async (credentials: LoginInput) => {
    const { token, user: loggedUser } = await authService.login(credentials);
    saveSession(token, loggedUser);
    setUser(loggedUser);
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    const { token, user: newUser } = await authService.register(data);
    saveSession(token, newUser);
    setUser(newUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
