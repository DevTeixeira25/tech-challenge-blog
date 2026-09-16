import { User } from '@prisma/client';
import { prisma } from '../lib/prisma';

interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

/**
 * Repositório de usuários (docentes).
 * Mesma ideia do de posts: é a única camada que fala com o Prisma.
 */
export const usersRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  },
};

export type UsersRepository = typeof usersRepository;
