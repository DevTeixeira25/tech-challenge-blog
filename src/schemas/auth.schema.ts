import { z } from 'zod';
import { newPasswordSchema } from './password.schema';

/** Validação do corpo do login (POST /auth/login). */
export const loginSchema = z.object({
  email: z
    .string({ error: (issue) => issue.input === undefined ? 'email é obrigatório' : undefined })
    .trim()
    .email('email inválido'),
  // Login mantém compatibilidade com senhas legadas; restrição em bytes vale para senhas novas.
  password: z
    .string({ error: (issue) => issue.input === undefined ? 'password é obrigatório' : undefined })
    .min(6, 'password deve ter ao menos 6 caracteres'),
});

/** Cadastro de estudante ou, com convite válido, de docente. */
export const registerSchema = z.object({
  name: z
    .string({ error: (issue) => issue.input === undefined ? 'name é obrigatório' : undefined })
    .trim()
    .min(3, 'name deve ter ao menos 3 caracteres')
    .max(120, 'name deve ter no máximo 120 caracteres'),
  email: z
    .string({ error: (issue) => issue.input === undefined ? 'email é obrigatório' : undefined })
    .trim()
    .email('email inválido'),
  // Senha nova exige mais que o login: aqui é o momento de escolher uma boa.
  password: newPasswordSchema,
  // Sem convite cria STUDENT; com convite válido cria TEACHER.
  code: z
    .string()
    .trim()
    .transform((value) => (value ? value : undefined))
    .optional(),
});

/** Validação da geração de convite (POST /auth/invites). */
export const createInviteSchema = z.object({
  // Opcional: restringe o convite a um e-mail específico.
  email: z.string().trim().email('email inválido').optional(),
  // Validade em dias; o padrão de 7 cobre o caso comum.
  expiresInDays: z.coerce.number().int().min(1).max(90).default(7),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
