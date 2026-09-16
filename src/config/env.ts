import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL inválida' }),
  // Chave usada para assinar os tokens JWT do login dos docentes.
  // Tem um default só para não travar o ambiente de desenvolvimento/CI;
  // em produção precisa ser definida (ver aviso abaixo).
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET deve ter ao menos 16 caracteres')
    .default('dev-secret-troque-em-producao'),
  JWT_EXPIRES_IN: z.string().default('1d'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    'Variaveis de ambiente invalidas:',
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;

if (env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('JWT_SECRET nao definida em producao. Defina a variavel.');
  process.exit(1);
}
