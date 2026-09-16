import { request } from './http';
import type {
  Invite,
  LoginInput,
  LoginResponse,
  RegisterInput,
  User,
} from '../types';

/** Chamadas aos endpoints REST de autenticação. */
export const authService = {
  login(credentials: LoginInput): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
    });
  },

  /** Cadastro com código de convite; já devolve o token do novo docente. */
  register(data: RegisterInput): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: data,
    });
  },

  /** Gera um convite para um(a) colega (exige estar autenticado). */
  createInvite(data: {
    email?: string;
    expiresInDays?: number;
  }): Promise<Invite> {
    return request<Invite>('/auth/invites', {
      method: 'POST',
      body: data,
      auth: true,
    });
  },

  listInvites(signal?: AbortSignal): Promise<Invite[]> {
    return request<Invite[]>('/auth/invites', { auth: true, signal });
  },

  /** Valida o token guardado e devolve o perfil do docente. */
  me(signal?: AbortSignal): Promise<User> {
    return request<User>('/auth/me', { auth: true, signal });
  },
};
