import { Invite } from '@prisma/client';
import { prisma } from '../lib/prisma';

interface CreateInviteData {
  code: string;
  email?: string | null;
  expiresAt: Date;
  createdBy?: string | null;
}

/** Repositório de convites: única camada que fala com o Prisma. */
export const invitesRepository = {
  findByCode(code: string): Promise<Invite | null> {
    return prisma.invite.findUnique({ where: { code } });
  },

  create(data: CreateInviteData): Promise<Invite> {
    return prisma.invite.create({ data });
  },

  /** Marca o convite como usado. Um convite vale uma única vez. */
  markAsUsed(id: string, usedBy: string): Promise<Invite> {
    return prisma.invite.update({
      where: { id },
      data: { usedAt: new Date(), usedBy },
    });
  },

  listRecent(limit = 50): Promise<Invite[]> {
    return prisma.invite.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};

export type InvitesRepository = typeof invitesRepository;
