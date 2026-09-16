import { useContext } from 'react';
import { AuthContext } from '../contexts/auth-context';
import type { AuthContextValue } from '../contexts/auth-context';

/** Acesso ao contexto de autenticação (falha claro se faltar o provider). */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  }

  return context;
}
