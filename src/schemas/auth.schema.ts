import { z } from 'zod';

/** Validação do corpo do login (POST /auth/login). */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'email é obrigatório' })
    .trim()
    .email('email inválido'),
  password: z
    .string({ required_error: 'password é obrigatório' })
    .min(6, 'password deve ter ao menos 6 caracteres'),
});

/** Validação do cadastro por convite (POST /auth/register). */
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'name é obrigatório' })
    .trim()
    .min(3, 'name deve ter ao menos 3 caracteres')
    .max(120, 'name deve ter no máximo 120 caracteres'),
  email: z
    .string({ required_error: 'email é obrigatório' })
    .trim()
    .email('email inválido'),
  // Senha nova exige mais que o login: aqui é o momento de escolher uma boa.
  password: z
    .string({ required_error: 'password é obrigatório' })
    .min(8, 'password deve ter ao menos 8 caracteres')
    .max(72, 'password deve ter no máximo 72 caracteres'),
  // Opcional: o cadastro é aberto. Quem recebeu um convite informa o código
  // aqui e o convite é consumido; quem não recebeu cria a conta direto.
  code: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
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
