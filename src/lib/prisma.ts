import { PrismaClient } from '@prisma/client';

// Singleton do PrismaClient para evitar múltiplas conexões
// (importante em dev com hot-reload).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
