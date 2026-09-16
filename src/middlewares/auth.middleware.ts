import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import { verifyToken } from '../services/auth.service';

/** Dados do docente autenticado, anexados à request. */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; name: string; email: string };
    }
  }
}

/**
 * Exige um token JWT válido no header `Authorization: Bearer <token>`.
 * Usado nas rotas de criação, edição e exclusão de posts.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de autenticação ausente');
    }

    const payload = verifyToken(header.slice('Bearer '.length).trim());

    req.user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
    };

    next();
  } catch (err) {
    next(err);
  }
}
