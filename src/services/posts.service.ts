import { Post } from '@prisma/client';
import { NotFoundError } from '../errors/AppError';
import {
  postsRepository,
  PostsRepository,
} from '../repositories/posts.repository';
import { CreatePostInput, UpdatePostInput } from '../schemas/post.schema';

/**
 * Regras de negócio dos posts.
 * Recebe o repositório por injeção (default = real) para permitir
 * testes unitários com um repositório mockado.
 */
export class PostsService {
  constructor(private readonly repo: PostsRepository = postsRepository) {}

  list(): Promise<Post[]> {
    return this.repo.findAll();
  }

  async getById(id: string): Promise<Post> {
    const post = await this.repo.findById(id);
    if (!post) {
      throw new NotFoundError(`Post com id "${id}" não encontrado`);
    }
    return post;
  }

  create(data: CreatePostInput): Promise<Post> {
    return this.repo.create(data);
  }

  async update(id: string, data: UpdatePostInput): Promise<Post> {
    // Garante 404 explícito em vez do erro cru do Prisma (P2025).
    await this.getById(id);
    return this.repo.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await this.repo.delete(id);
  }

  search(term: string): Promise<Post[]> {
    return this.repo.search(term);
  }
}

export const postsService = new PostsService();
