import { Post } from '@prisma/client';
import { PostsService } from '../src/services/posts.service';
import { PostsRepository } from '../src/repositories/posts.repository';
import { NotFoundError } from '../src/errors/AppError';

/**
 * Testes UNITÁRIOS do PostsService.
 * O repositório é totalmente mockado — não há acesso a banco.
 * Cobre as funções críticas exigidas: create, update, delete (remove) e busca.
 */

function makePost(overrides: Partial<Post> = {}): Post {
  const now = new Date('2026-01-01T00:00:00Z');
  return {
    id: 'post-1',
    title: 'Título',
    content: 'Conteúdo',
    author: 'Autor',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Cria um mock tipado do repositório. */
function makeRepoMock(): jest.Mocked<PostsRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
  };
}

describe('PostsService', () => {
  let repo: jest.Mocked<PostsRepository>;
  let service: PostsService;

  beforeEach(() => {
    repo = makeRepoMock();
    service = new PostsService(repo);
  });

  describe('list', () => {
    it('retorna todos os posts do repositório', async () => {
      const posts = [makePost(), makePost({ id: 'post-2' })];
      repo.findAll.mockResolvedValue(posts);

      const result = await service.list();

      expect(result).toEqual(posts);
      expect(repo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById', () => {
    it('retorna o post quando existe', async () => {
      const post = makePost();
      repo.findById.mockResolvedValue(post);

      await expect(service.getById('post-1')).resolves.toEqual(post);
      expect(repo.findById).toHaveBeenCalledWith('post-1');
    });

    it('lança NotFoundError quando o post não existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById('inexistente')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('create', () => {
    it('delega a criação ao repositório e retorna o post criado', async () => {
      const input = { title: 'Novo', content: 'Texto', author: 'Prof.' };
      const created = makePost(input);
      repo.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(repo.create).toHaveBeenCalledWith(input);
    });
  });

  describe('update', () => {
    it('atualiza quando o post existe', async () => {
      const existing = makePost();
      const updated = makePost({ title: 'Editado' });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockResolvedValue(updated);

      const result = await service.update('post-1', { title: 'Editado' });

      expect(result).toEqual(updated);
      expect(repo.update).toHaveBeenCalledWith('post-1', { title: 'Editado' });
    });

    it('lança NotFoundError e NÃO chama update quando o post não existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.update('x', { title: 'Editado' }),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('exclui quando o post existe', async () => {
      repo.findById.mockResolvedValue(makePost());
      repo.delete.mockResolvedValue(makePost());

      await service.remove('post-1');

      expect(repo.delete).toHaveBeenCalledWith('post-1');
    });

    it('lança NotFoundError e NÃO chama delete quando o post não existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundError);
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('repassa o termo para o repositório', async () => {
      const found = [makePost()];
      repo.search.mockResolvedValue(found);

      const result = await service.search('fotossíntese');

      expect(result).toEqual(found);
      expect(repo.search).toHaveBeenCalledWith('fotossíntese');
    });
  });
});
