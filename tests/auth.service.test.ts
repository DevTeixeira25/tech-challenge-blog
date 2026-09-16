import bcrypt from 'bcryptjs';
import { Invite, User } from '@prisma/client';
import { AuthService, verifyToken } from '../src/services/auth.service';
import { UsersRepository } from '../src/repositories/users.repository';
import { InvitesRepository } from '../src/repositories/invites.repository';
import { AppError, ConflictError, UnauthorizedError } from '../src/errors/AppError';

/**
 * Testes UNITÁRIOS do AuthService.
 * Os repositórios são mockados, então não há acesso a banco: aqui só interessa
 * a regra (senha confere? convite vale? token é emitido com os dados certos?).
 */

const PASSWORD = 'senha123';

async function makeUser(overrides: Partial<User> = {}): Promise<User> {
  const now = new Date('2026-01-01T00:00:00Z');
  return {
    id: 'user-1',
    name: 'Prof. Teste',
    email: 'teste@blog.dev',
    passwordHash: await bcrypt.hash(PASSWORD, 8),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Convite válido: ainda não usado e com validade no futuro. */
function makeInvite(overrides: Partial<Invite> = {}): Invite {
  return {
    id: 'invite-1',
    code: 'ABCD-EFGH-JKLM',
    email: null,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    usedAt: null,
    createdBy: 'user-1',
    usedBy: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function makeRepoMock(): jest.Mocked<UsersRepository> {
  return {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
}

function makeInvitesMock(): jest.Mocked<InvitesRepository> {
  return {
    findByCode: jest.fn(),
    create: jest.fn(),
    markAsUsed: jest.fn(),
    listRecent: jest.fn(),
  };
}

describe('AuthService', () => {
  let repo: jest.Mocked<UsersRepository>;
  let invites: jest.Mocked<InvitesRepository>;
  let service: AuthService;

  beforeEach(() => {
    repo = makeRepoMock();
    invites = makeInvitesMock();
    service = new AuthService(repo, invites);
  });

  describe('login', () => {
    it('devolve token válido e usuário sem o hash da senha', async () => {
      const user = await makeUser();
      repo.findByEmail.mockResolvedValue(user);

      const result = await service.login({
        email: user.email,
        password: PASSWORD,
      });

      expect(result.user).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
      });

      const payload = verifyToken(result.token);
      expect(payload.sub).toBe(user.id);
      expect(payload.email).toBe(user.email);
    });

    it('normaliza o e-mail para minúsculas antes de buscar', async () => {
      repo.findByEmail.mockResolvedValue(await makeUser());

      await service.login({ email: 'TESTE@BLOG.DEV', password: PASSWORD });

      expect(repo.findByEmail).toHaveBeenCalledWith('teste@blog.dev');
    });

    it('lança 401 quando o e-mail não existe', async () => {
      repo.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ninguem@blog.dev', password: PASSWORD }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('lança 401 quando a senha não confere', async () => {
      repo.findByEmail.mockResolvedValue(await makeUser());

      await expect(
        service.login({ email: 'teste@blog.dev', password: 'errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('register', () => {
    const validInput = {
      name: 'Prof. Novo',
      email: 'novo@blog.dev',
      password: 'senhaforte1',
      code: 'ABCD-EFGH-JKLM',
    };

    it('cadastra sem código de convite: o cadastro é aberto', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(await makeUser({ id: 'user-novo' }));

      const { code, ...semConvite } = validInput;
      void code;

      const result = await service.register(semConvite);

      expect(result.user.id).toBe('user-novo');
      expect(verifyToken(result.token).sub).toBe('user-novo');
      // Sem código informado, nem chega a consultar convites.
      expect(invites.findByCode).not.toHaveBeenCalled();
      expect(invites.markAsUsed).not.toHaveBeenCalled();
    });

    it('trata código vazio como ausente', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(await makeUser({ id: 'user-novo' }));

      await service.register({ ...validInput, code: undefined });

      expect(invites.findByCode).not.toHaveBeenCalled();
    });

    it('cria o docente, marca o convite como usado e já devolve o token', async () => {
      invites.findByCode.mockResolvedValue(makeInvite());
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockImplementation(async (data) =>
        makeUser({
          id: 'user-novo',
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
        }),
      );
      invites.markAsUsed.mockResolvedValue(makeInvite({ usedAt: new Date() }));

      const result = await service.register(validInput);

      expect(result.user).toEqual({
        id: 'user-novo',
        name: validInput.name,
        email: validInput.email,
      });
      expect(verifyToken(result.token).sub).toBe('user-novo');
      expect(invites.markAsUsed).toHaveBeenCalledWith('invite-1', 'user-novo');

      // A senha tem que ir para o banco como hash, nunca em texto claro.
      const created = repo.create.mock.calls[0][0];
      expect(created.passwordHash).not.toBe(validInput.password);
      await expect(
        bcrypt.compare(validInput.password, created.passwordHash),
      ).resolves.toBe(true);
    });

    it('aceita o código em minúsculas e com espaços', async () => {
      invites.findByCode.mockResolvedValue(makeInvite());
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(await makeUser({ id: 'user-novo' }));
      invites.markAsUsed.mockResolvedValue(makeInvite());

      await service.register({ ...validInput, code: '  abcd-efgh-jklm ' });

      expect(invites.findByCode).toHaveBeenCalledWith('ABCD-EFGH-JKLM');
    });

    it('recusa código inexistente', async () => {
      invites.findByCode.mockResolvedValue(null);

      await expect(service.register(validInput)).rejects.toThrow(
        'Convite inválido',
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('recusa convite já utilizado', async () => {
      invites.findByCode.mockResolvedValue(
        makeInvite({ usedAt: new Date('2026-02-01T00:00:00Z') }),
      );

      await expect(service.register(validInput)).rejects.toThrow(
        'já foi utilizado',
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('recusa convite expirado', async () => {
      invites.findByCode.mockResolvedValue(
        makeInvite({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.register(validInput)).rejects.toThrow('expirou');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('recusa convite nominal usado por outro e-mail', async () => {
      invites.findByCode.mockResolvedValue(
        makeInvite({ email: 'outra.pessoa@blog.dev' }),
      );

      await expect(service.register(validInput)).rejects.toBeInstanceOf(
        AppError,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('aceita convite nominal quando o e-mail confere (ignorando caixa)', async () => {
      invites.findByCode.mockResolvedValue(
        makeInvite({ email: 'novo@blog.dev' }),
      );
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(await makeUser({ id: 'user-novo' }));
      invites.markAsUsed.mockResolvedValue(makeInvite());

      await expect(
        service.register({ ...validInput, email: 'NOVO@blog.dev' }),
      ).resolves.toHaveProperty('token');
    });

    it('recusa e-mail já cadastrado com 409', async () => {
      invites.findByCode.mockResolvedValue(makeInvite());
      repo.findByEmail.mockResolvedValue(await makeUser());

      await expect(service.register(validInput)).rejects.toBeInstanceOf(
        ConflictError,
      );
      expect(invites.markAsUsed).not.toHaveBeenCalled();
    });
  });

  describe('convites', () => {
    it('gera código no formato XXXX-XXXX-XXXX e guarda quem convidou', async () => {
      invites.create.mockImplementation(async (data) =>
        makeInvite({ code: data.code, expiresAt: data.expiresAt }),
      );

      const invite = await service.createInvite({ expiresInDays: 7 }, 'user-1');

      expect(invite.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(invites.create).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'user-1', email: null }),
      );
      expect(invite.status).toBe('ativo');
    });

    it('respeita a validade em dias informada', async () => {
      invites.create.mockImplementation(async (data) =>
        makeInvite({ expiresAt: data.expiresAt }),
      );

      await service.createInvite({ expiresInDays: 30 }, 'user-1');

      const { expiresAt } = invites.create.mock.calls[0][0];
      const dias = Math.round(
        (expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
      );
      expect(dias).toBe(30);
    });

    it('classifica a situação de cada convite ao listar', async () => {
      invites.listRecent.mockResolvedValue([
        makeInvite({ id: 'a' }),
        makeInvite({ id: 'b', usedAt: new Date() }),
        makeInvite({ id: 'c', expiresAt: new Date(Date.now() - 1000) }),
      ]);

      const lista = await service.listInvites();

      expect(lista.map((i) => i.status)).toEqual([
        'ativo',
        'usado',
        'expirado',
      ]);
    });
  });

  describe('perfil e token', () => {
    it('getProfile devolve o docente do token', async () => {
      const user = await makeUser();
      repo.findById.mockResolvedValue(user);

      await expect(service.getProfile(user.id)).resolves.toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    });

    it('getProfile lança 401 quando o usuário do token sumiu', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getProfile('some-id')).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });

    it('verifyToken lança 401 para token inválido', () => {
      expect(() => verifyToken('nao-e-um-token')).toThrow(UnauthorizedError);
    });
  });
});
