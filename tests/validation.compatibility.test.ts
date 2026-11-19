import express from 'express';
import request from 'supertest';
import { errorHandler } from '../src/middlewares/error.middleware';
import { loginSchema, registerSchema } from '../src/schemas/auth.schema';
import { createPostSchema, searchPostSchema } from '../src/schemas/post.schema';
import { createPersonSchema, updatePersonSchema, peoplePaginationSchema } from '../src/schemas/people.schema';

const app = express();
app.use(express.json());
for (const [path, schema] of Object.entries({ login: loginSchema, register: registerSchema, post: createPostSchema, search: searchPostSchema })) {
  app.post(`/${path}`, (req, res, next) => {
    try { res.json(schema.parse(req.body)); }
    catch (error) { next(error); }
  });
}
app.use(errorHandler);

describe('Contrato de validação após atualização do Zod', () => {
  it('mantém HTTP400, mensagem e mapa de erros por campo em português', async () => {
    const response = await request(app).post('/register').send({});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'ValidationError', message: 'Dados inválidos',
      details: { name: ['name é obrigatório'], email: ['email é obrigatório'], password: ['password é obrigatório'] },
    });
  });
  it('mantém mensagens de tamanho e e-mail, sem expor entradas ou exceções', async () => {
    const response = await request(app).post('/register').send({ name: 'ab', email: 'invalido', password: '123' });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'ValidationError', message: 'Dados inválidos',
      details: { name: ['name deve ter ao menos 3 caracteres'], email: ['email inválido'], password: ['password deve ter ao menos 8 caracteres'] },
    });
  });
  it('preserva mensagens obrigatórias dos demais formulários', async () => {
    expect((await request(app).post('/login').send({})).body.details).toEqual({ email: ['email é obrigatório'], password: ['password é obrigatório'] });
    expect((await request(app).post('/post').send({})).body.details).toEqual({ title: ['title é obrigatório'], content: ['content é obrigatório'], author: ['author é obrigatório'] });
    expect((await request(app).post('/search').send({})).body.details).toEqual({ q: ['query string "q" é obrigatória'] });
  });
  it('preserva defaults, normalização e restrições de atualização/perfil', () => {
    expect(registerSchema.parse({ name: 'Pessoa Teste', email: 'pessoa@example.test', password: 'senha1234' })).not.toHaveProperty('code');
    expect(registerSchema.parse({ name: 'Pessoa Teste', email: 'pessoa@example.test', password: 'senha1234', code: '  ' }).code).toBeUndefined();
    expect(peoplePaginationSchema.parse({})).toEqual({ page: 1, pageSize: 10 });
    expect(peoplePaginationSchema.parse({ page: '2', pageSize: '20' })).toEqual({ page: 2, pageSize: 20 });
    expect(updatePersonSchema.safeParse({}).success).toBe(false);
    expect(updatePersonSchema.safeParse({ role: 'TEACHER' }).success).toBe(false);
    expect(createPersonSchema.parse({ name: ' Pessoa Teste ', email: 'PESSOA@example.test', password: 'senha1234' })).toEqual({ name: 'Pessoa Teste', email: 'pessoa@example.test', password: 'senha1234' });
  });
});
