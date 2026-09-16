import type { User } from '../types';

/**
 * Persistência da sessão no localStorage.
 * Fica isolada aqui para o resto do app não depender do storage direto
 * (e para o modo anônimo do navegador, onde o acesso pode falhar).
 */
const TOKEN_KEY = 'blog.token';
const USER_KEY = 'blog.user';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: User): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Sem storage disponível a sessão vale só enquanto a aba estiver aberta.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Nada a fazer: o estado em memória já foi limpo pelo AuthContext.
  }
}
