import { z } from 'zod';
import { newPasswordSchema } from './password.schema';

const fields = {
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: newPasswordSchema,
};

// Perfil é fixado pela rota: campos extras, inclusive role, são rejeitados.
export const createPersonSchema = z.object(fields).strict();
export const updatePersonSchema = z.object(fields).partial().strict()
  .refine((value) => Object.keys(value).length > 0, 'Informe ao menos um campo');
export const peoplePaginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
