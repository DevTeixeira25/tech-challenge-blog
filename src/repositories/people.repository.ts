import { Role, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, ConflictError, NotFoundError, UnauthorizedError } from '../errors/AppError';

// Projeção explícita: nenhuma leitura administrativa expõe o hash.
const publicFields = { id: true, name: true, email: true, role: true } as const;
export const peopleRepository = {
  async list(role: Role, page: number, pageSize: number) {
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: { role }, select: publicFields,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.user.count({ where: { role } }),
    ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  },
  findById(id: string, role: Role) {
    return prisma.user.findFirst({ where: { id, role }, select: publicFields });
  },
  create(data: { name: string; email: string; passwordHash: string; role: Role }) {
    return prisma.user.create({ data, select: publicFields });
  },
  update(id: string, role: Role, data: { name?: string; email?: string; passwordHash?: string }) {
    return prisma.user.update({ where: { id, role }, data, select: publicFields });
  },
  remove(id: string, role: Role, actorId: string) {
    return prisma.$transaction(async (tx) => {
      // Serializa exclusões nesta aplicação. READ COMMITTED renova a visão após o lock.
      // A segunda exclusão precisa observar se seu ator foi removido pela primeira.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(724004)`;
      const actor = await tx.user.findUnique({ where: { id: actorId }, select: { role: true } });
      if (!actor) throw new UnauthorizedError('Usuário do token não existe mais');
      if (actor.role !== Role.TEACHER) throw new AppError('Acesso permitido apenas a docentes', 403);
      if (role === Role.TEACHER && id === actorId) {
        throw new ConflictError('Você não pode excluir sua própria conta docente');
      }
      const target = await tx.user.findFirst({ where: { id, role }, select: { id: true } });
      if (!target) throw new NotFoundError('Pessoa não encontrada neste perfil');
      if (role === Role.TEACHER && await tx.user.count({ where: { role } }) <= 1) {
        throw new ConflictError('A escola deve manter ao menos uma conta docente');
      }
      return tx.user.delete({ where: { id, role }, select: { id: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  },
};
export type PeopleRepository = typeof peopleRepository;
