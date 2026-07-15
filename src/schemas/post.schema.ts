import { z } from 'zod';

/** Validação do corpo para criação de post (POST /posts). */
export const createPostSchema = z.object({
  title: z
    .string({ required_error: 'title é obrigatório' })
    .trim()
    .min(1, 'title não pode ser vazio')
    .max(200, 'title deve ter no máximo 200 caracteres'),
  content: z
    .string({ required_error: 'content é obrigatório' })
    .trim()
    .min(1, 'content não pode ser vazio'),
  author: z
    .string({ required_error: 'author é obrigatório' })
    .trim()
    .min(1, 'author não pode ser vazio')
    .max(120, 'author deve ter no máximo 120 caracteres'),
});

/** Validação do corpo para edição (PUT /posts/:id) — todos opcionais. */
export const updatePostSchema = createPostSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

/** Validação da query de busca (GET /posts/search). */
export const searchPostSchema = z.object({
  q: z
    .string({ required_error: 'query string "q" é obrigatória' })
    .trim()
    .min(1, 'query string "q" não pode ser vazia'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
