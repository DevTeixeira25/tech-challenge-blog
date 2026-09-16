import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Invite } from '@prisma/client';
import { env } from '../config/env';
import { AppError, ConflictError, UnauthorizedError } from '../errors/AppError';
import {
  usersRepository,
  UsersRepository,
} from '../repositories/users.repository';
import {
  invitesRepository,
  InvitesRepository,
} from '../repositories/invites.repository';
import {
  CreateInviteInput,
  LoginInput,
  RegisterInput,
} from '../schemas/auth.schema';

/** Usuário como ele é devolvido pela API (sem o hash da senha). */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

export interface LoginResult {
  token: string;
  user: PublicUser;
}

/** Conteúdo que vai dentro do JWT. */
export interface TokenPayload {
  sub: string;
  name: string;
  email: string;
}

/** Convite como ele aparece na API (com a situação já calculada). */
export interface PublicInvite {
  id: string;
  code: string;
  email: string | null;
  expiresAt: string;
  usedAt: string | null;
  status: 'ativo' | 'usado' | 'expirado';
}

/** Alfabeto sem caracteres ambíguos (0/O, 1/I/L), para ditar o código por voz. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Gera um código no formato XXXX-XXXX-XXXX. */
function generateInviteCode(): string {
  const block = () =>
    Array.from(
      { length: 4 },
      () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
    ).join('');

  return `${block()}-${block()}-${block()}`;
}

function toPublicInvite(invite: Invite): PublicInvite {
  const expired = invite.expiresAt.getTime() < Date.now();

  return {
    id: invite.id,
    code: invite.code,
    email: invite.email,
    expiresAt: invite.expiresAt.toISOString(),
    usedAt: invite.usedAt ? invite.usedAt.toISOString() : null,
    status: invite.usedAt ? 'usado' : expired ? 'expirado' : 'ativo',
  };
}

/**
 * Regras de autenticação dos docentes.
 * Recebe os repositórios por injeção (default = reais) para permitir
 * testes unitários com mocks.
 */
export class AuthService {
  constructor(
    private readonly repo: UsersRepository = usersRepository,
    private readonly invites: InvitesRepository = invitesRepository,
  ) {}

  async login({ email, password }: LoginInput): Promise<LoginResult> {
    const user = await this.repo.findByEmail(email.toLowerCase());

    // Mensagem genérica de propósito: não entrega se o e-mail existe.
    if (!user) {
      throw new UnauthorizedError('E-mail ou senha inválidos');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('E-mail ou senha inválidos');
    }

    const publicUser: PublicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    return { token: this.signToken(publicUser), user: publicUser };
  }

  /**
   * Cadastro de um(a) novo(a) docente.
   *
   * O cadastro é aberto: nome, e-mail e senha bastam. O código de convite é
   * opcional — quem recebeu um informa aqui, o convite é validado e marcado
   * como usado, o que mantém o registro de quem entrou por indicação.
   */
  async register({
    name,
    email,
    password,
    code,
  }: RegisterInput): Promise<LoginResult> {
    const normalizedEmail = email.toLowerCase();
    const invite = code
      ? await this.validateInvite(code, normalizedEmail)
      : null;

    const existing = await this.repo.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictError('Já existe uma conta com este e-mail');
    }

    const user = await this.repo.create({
      name,
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
    });

    if (invite) {
      await this.invites.markAsUsed(invite.id, user.id);
    }

    const publicUser: PublicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    // Já devolve o token: quem acabou de se cadastrar entra direto.
    return { token: this.signToken(publicUser), user: publicUser };
  }

  /**
   * Confere um código informado no cadastro. Um convite vale uma única vez,
   * expira e, quando nominal, só serve para o e-mail indicado.
   */
  private async validateInvite(code: string, email: string): Promise<Invite> {
    const invite = await this.invites.findByCode(code.trim().toUpperCase());

    if (!invite) {
      throw new AppError('Convite inválido', 400);
    }

    if (invite.usedAt) {
      throw new AppError('Este convite já foi utilizado', 400);
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      throw new AppError('Este convite expirou', 400);
    }

    if (invite.email && invite.email.toLowerCase() !== email) {
      throw new AppError('Este convite foi emitido para outro e-mail', 400);
    }

    return invite;
  }

  /** Gera um convite. Quem convida é um(a) docente já autenticado(a). */
  async createInvite(
    { email, expiresInDays }: CreateInviteInput,
    createdBy: string,
  ): Promise<PublicInvite> {
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    const invite = await this.invites.create({
      code: generateInviteCode(),
      email: email ? email.toLowerCase() : null,
      expiresAt,
      createdBy,
    });

    return toPublicInvite(invite);
  }

  async listInvites(): Promise<PublicInvite[]> {
    const invites = await this.invites.listRecent();
    return invites.map(toPublicInvite);
  }

  async getProfile(id: string): Promise<PublicUser> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new UnauthorizedError('Usuário do token não existe mais');
    }
    return { id: user.id, name: user.name, email: user.email };
  }

  private signToken(user: PublicUser): string {
    const payload: TokenPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }
}

export const authService = new AuthService();

/** Verifica um token e devolve o payload; lança 401 se for inválido/expirado. */
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch {
    throw new UnauthorizedError('Token inválido ou expirado');
  }
}
