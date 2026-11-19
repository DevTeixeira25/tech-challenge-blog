import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { AppError, UnauthorizedError } from '../errors/AppError';
import { authService, PublicUser, verifyToken } from '../services/auth.service';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

/** O token identifica a pessoa; perfil e permissões sempre vêm do banco. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de autenticação ausente');
    }
    const payload = verifyToken(header.slice('Bearer '.length).trim());
    req.user = await authService.getProfile(payload.sub);
    next();
  } catch (err) {
    next(err);
  }
}

/** Deve vir após requireAuth: não confia em claims de perfil no JWT. */
export function requireTeacher(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError('Autenticação necessária'));
  if (req.user.role !== Role.TEACHER) {
    return next(new AppError('Acesso permitido apenas a docentes', 403));
  }
  next();
}
