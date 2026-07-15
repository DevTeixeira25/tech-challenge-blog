import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

/** Rota não encontrada (404). */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'NotFound',
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Tratamento central de erros. Traduz erros conhecidos
 * (validação Zod, AppError, Prisma) em respostas HTTP consistentes.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  // Erro de validação de entrada
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Dados inválidos',
      details: err.flatten().fieldErrors,
    });
  }

  // Erro de aplicação (ex.: NotFoundError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
    });
  }

  // Registro inexistente no Prisma (ex.: update/delete de id inválido)
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2025'
  ) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Registro não encontrado',
    });
  }

  console.error('Erro não tratado:', err);
  return res.status(500).json({
    error: 'InternalServerError',
    message: 'Ocorreu um erro interno no servidor',
  });
}
