import { NextFunction, Request, Response } from 'express';
import { postsService } from '../services/posts.service';
import {
  createPostSchema,
  searchPostSchema,
  updatePostSchema,
} from '../schemas/post.schema';

/**
 * Controllers dos posts: fazem a ponte entre HTTP e service.
 * Validação com Zod acontece aqui; erros vão para o middleware central
 * via next(err).
 */
export const postsController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const posts = await postsService.list();
      res.json(posts);
    } catch (err) {
      next(err);
    }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = searchPostSchema.parse(req.query);
      const posts = await postsService.search(q);
      res.json(posts);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await postsService.getById(req.params.id);
      res.json(post);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createPostSchema.parse(req.body);
      const post = await postsService.create(data);
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updatePostSchema.parse(req.body);
      const post = await postsService.update(req.params.id, data);
      res.json(post);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await postsService.remove(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
