import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { createTestTeacher, loginTestTeacher } from './helpers/auth';

/**
 * Testes de INTEGRAÇÃO (end-to-end) com Supertest.
 * Exercitam os endpoints reais contra um banco PostgreSQL de verdade.
 *
 * Requer DATABASE_URL apontando para um banco de teste com as migrations
 * aplicadas (no CI é o serviço `postgres`; local: `docker compose up -d db`).
 */

const app = createApp();

/** Token do docente de teste; escrita nos posts exige autenticação. */
let token: string;

/** Atalho para mandar o header Authorization nas rotas protegidas. */
const auth = () => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  await createTestTeacher();
  token = await loginTestTeacher(app);
});

beforeEach(async () => {
  await prisma.post.deleteMany();
});

afterAll(async () => {
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

const validPost = {
  title: 'Introdução à fotossíntese',
  content: 'A fotossíntese converte luz em energia.',
  author: 'Prof. Carlos',
};

/** Cria um post já autenticado (usado como arranjo em vários testes). */
const createPost = (data: Record<string, unknown> = validPost) =>
  request(app).post('/posts').set(auth()).send(data);

describe('Posts API (e2e)', () => {
  it('GET /health responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('POST /posts cria um post e retorna 201', async () => {
    const res = await createPost();

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(validPost);
    expect(res.body.id).toBeDefined();
  });

  it('POST /posts retorna 400 quando faltam campos', async () => {
    const res = await createPost({ title: 'só título' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });

  it('GET /posts lista os posts criados', async () => {
    await createPost();

    const res = await request(app).get('/posts');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('GET /posts/:id retorna o post', async () => {
    const created = await createPost();

    const res = await request(app).get(`/posts/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it('GET /posts/:id retorna 404 para id inexistente', async () => {
    const res = await request(app).get('/posts/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('PUT /posts/:id edita o post', async () => {
    const created = await createPost();

    const res = await request(app)
      .put(`/posts/${created.body.id}`)
      .set(auth())
      .send({ title: 'Título editado' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Título editado');
  });

  it('DELETE /posts/:id remove o post e retorna 204', async () => {
    const created = await createPost();

    const del = await request(app).delete(`/posts/${created.body.id}`).set(auth());
    expect(del.status).toBe(204);

    const get = await request(app).get(`/posts/${created.body.id}`);
    expect(get.status).toBe(404);
  });

  it('GET /posts/search encontra por palavra-chave no título', async () => {
    await createPost();
    await createPost({ title: 'Outro assunto', content: 'nada a ver', author: 'X' });

    const res = await request(app).get('/posts/search').query({ q: 'fotossíntese' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe(validPost.title);
  });

  it('GET /posts/search retorna 400 sem o parâmetro q', async () => {
    const res = await request(app).get('/posts/search');
    expect(res.status).toBe(400);
  });
});

describe('Posts API — rotas protegidas', () => {
  it('POST /posts sem token retorna 401', async () => {
    const res = await request(app).post('/posts').send(validPost);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UnauthorizedError');
  });

  it('PUT /posts/:id sem token retorna 401', async () => {
    const created = await createPost();

    const res = await request(app)
      .put(`/posts/${created.body.id}`)
      .send({ title: 'Tentando editar' });

    expect(res.status).toBe(401);
  });

  it('DELETE /posts/:id sem token retorna 401', async () => {
    const created = await createPost();

    const res = await request(app).delete(`/posts/${created.body.id}`);

    expect(res.status).toBe(401);
  });

  it('POST /posts com token inválido retorna 401', async () => {
    const res = await request(app)
      .post('/posts')
      .set({ Authorization: 'Bearer token-invalido' })
      .send(validPost);

    expect(res.status).toBe(401);
  });
});
