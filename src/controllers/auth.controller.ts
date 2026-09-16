import { NextFunction, Request, Response } from 'express';
import {
  createInviteSchema,
  loginSchema,
  registerSchema,
} from '../schemas/auth.schema';
import { authService } from '../services/auth.service';

/** Controllers de autenticação: login, cadastro, convites e perfil. */
export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const credentials = loginSchema.parse(req.body);
      const result = await authService.login(credentials);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async createInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createInviteSchema.parse(req.body ?? {});
      // requireAuth garante que req.user existe neste ponto.
      const invite = await authService.createInvite(data, req.user!.id);
      res.status(201).json(invite);
    } catch (err) {
      next(err);
    }
  },

  async listInvites(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await authService.listInvites());
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
};
