import { Post, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CreatePostInput, UpdatePostInput } from '../schemas/post.schema';

/**
 * Repositório de Posts: única camada que fala com o Prisma.
 * Isolar o acesso a dados aqui deixa o service testável com um mock.
 */
export const postsRepository = {
  findAll(): Promise<Post[]> {
    return prisma.post.findMany({ orderBy: { createdAt: 'desc' } });
  },

  findById(id: string): Promise<Post | null> {
    return prisma.post.findUnique({ where: { id } });
  },

  create(data: CreatePostInput): Promise<Post> {
    return prisma.post.create({ data });
  },

  update(id: string, data: UpdatePostInput): Promise<Post> {
    return prisma.post.update({ where: { id }, data });
  },

  delete(id: string): Promise<Post> {
    return prisma.post.delete({ where: { id } });
  },

  /** Busca case-insensitive por termo no título OU no conteúdo. */
  search(term: string): Promise<Post[]> {
    const contains: Prisma.StringFilter = {
      contains: term,
      mode: 'insensitive',
    };
    return prisma.post.findMany({
      where: { OR: [{ title: contains }, { content: contains }] },
      orderBy: { createdAt: 'desc' },
    });
  },
};

export type PostsRepository = typeof postsRepository;
