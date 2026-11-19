import { z } from 'zod';

/** bcrypt usa somente os primeiros 72 bytes; limite em UTF-8 evita truncamento. */
export const newPasswordSchema = z
  .string({ error: (issue) => issue.input === undefined ? 'password é obrigatório' : undefined })
  .min(8, 'password deve ter ao menos 8 caracteres')
  .max(72, 'password deve ter no máximo 72 bytes em UTF-8')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72,
    'password deve ter no máximo 72 bytes em UTF-8');
