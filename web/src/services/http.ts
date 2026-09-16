import { getToken } from './session';

/** URL da API. Vem do .env (VITE_API_URL); em dev cai no localhost:3000. */
export const API_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

/** Erro de API com o status HTTP, para as telas decidirem o que mostrar. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Callback disparado quando a API responde 401 em uma rota autenticada.
 * O AuthProvider registra o logout aqui para a sessão expirada não ficar
 * "presa" na interface.
 */
let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Envia o token JWT no header Authorization. */
  auth?: boolean;
  signal?: AbortSignal;
}

/**
 * Wrapper do fetch: monta a URL, injeta o token, converte a resposta em JSON
 * e transforma erro da API em ApiError com mensagem legível.
 */
export async function request<T>(
  path: string,
  { method = 'GET', body, auth = false, signal }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    // Erro de rede (API fora do ar, CORS, sem internet...)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new ApiError(
      'Não foi possível falar com o servidor. Verifique se a API está no ar.',
      0,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && auth) {
      onUnauthorized?.();
    }

    throw new ApiError(
      payload?.message ?? `Erro ${response.status} ao chamar a API`,
      response.status,
      payload?.details,
    );
  }

  return payload as T;
}
