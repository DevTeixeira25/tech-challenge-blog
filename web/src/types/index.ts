/** Postagem como devolvida pela API (GET /posts). */
export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

/** Corpo aceito em POST /posts e PUT /posts/:id. */
export interface PostInput {
  title: string;
  content: string;
  author: string;
}

/** Docente autenticado (POST /auth/login e GET /auth/me). */
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

/** Cadastro de docente (POST /auth/register). O convite é opcional. */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  code?: string;
}

/** Convite gerado por um(a) docente (POST /auth/invites). */
export interface Invite {
  id: string;
  code: string;
  email: string | null;
  expiresAt: string;
  usedAt: string | null;
  status: 'ativo' | 'usado' | 'expirado';
}
