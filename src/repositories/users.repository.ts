import { Role, User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../errors/AppError';

interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

/**
 * Repositório de usuários (docentes e estudantes).
 * Mesma ideia do de posts: é a única camada que fala com o Prisma.
 */
export const usersRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: CreateUserData, inviteId?: string): Promise<User> {
    if (!inviteId) return prisma.user.create({ data });

    // Conta e consumo são atômicos: dois cadastros não podem reutilizar um convite.
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data });
      const consumed = await tx.invite.updateMany({
        where: {
          id: inviteId, usedAt: null, expiresAt: { gt: new Date() },
          OR: [{ email: null }, { email: { equals: data.email, mode: 'insensitive' } }],
        },
        data: { usedAt: new Date(), usedBy: user.id },
      });
      if (consumed.count !== 1) {
        throw new AppError('Este convite já foi utilizado ou expirou', 400);
      }
      return user;
    });
  },
};

export type UsersRepository = typeof usersRepository;
