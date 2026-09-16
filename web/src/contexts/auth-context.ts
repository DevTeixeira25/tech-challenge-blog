import { createContext } from 'react';
import type { LoginInput, RegisterInput, User } from '../types';

export interface AuthContextValue {
  /** Docente autenticado, ou null quando ninguém fez login. */
  user: User | null;
  /** true enquanto o token guardado ainda está sendo validado na API. */
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  /** Cadastro por convite: em caso de sucesso a pessoa já entra logada. */
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
}

/**
 * Contexto de autenticação (Context API).
 * Fica em um arquivo separado do provider para o Fast Refresh do Vite
 * continuar funcionando nos componentes.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);
