import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { createTestTeacher, testTeacher } from './helpers/auth';

/**
 * Testes de INTEGRAÇÃO do login dos docentes.
 * Mesmo pré-requisito dos testes de posts: banco de teste com migrations.
 */

const app = createApp();

beforeAll(async () => {
  await createTestTeacher();
});

beforeEach(async () => {
  await prisma.invite.deleteMany();
});

afterAll(async () => {
  await prisma.invite.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

/** Faz login com o docente de teste e devolve o token. */
async function loginToken(): Promise<string> {
  const res = await request(app).post('/auth/login').send({
    email: testTeacher.email,
    password: testTeacher.password,
  });
  return res.body.token as string;
}

describe('Auth API (e2e)', () => {
  it('POST /auth/login devolve token e dados do docente', async () => {
    const res = await request(app).post('/auth/login').send({
      email: testTeacher.email,
      password: testTeacher.password,
    });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({
      name: testTeacher.name,
      email: testTeacher.email,
    });
    // A senha (nem o hash) nunca pode voltar na resposta.
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('POST /auth/login retorna 401 com senha errada', async () => {
    const res = await request(app).post('/auth/login').send({
      email: testTeacher.email,
      password: 'senha-errada',
    });

    expect(res.status).toBe(401);
  });

  it('POST /auth/login retorna 401 com e-mail inexistente', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ninguem@blog.dev', password: 'senha123' });

    expect(res.status).toBe(401);
  });

  it('POST /auth/login retorna 400 com corpo inválido', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nao-e-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });

  it('GET /auth/me devolve o perfil do docente autenticado', async () => {
    const login = await request(app).post('/auth/login').send({
      email: testTeacher.email,
      password: testTeacher.password,
    });

    const res = await request(app)
      .get('/auth/me')
      .set({ Authorization: `Bearer ${login.body.token}` });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testTeacher.email);
  });

  it('GET /auth/me retorna 401 sem token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Convites e cadastro (e2e)', () => {
  it('POST /auth/invites exige autenticação', async () => {
    const res = await request(app).post('/auth/invites').send({});
    expect(res.status).toBe(401);
  });

  it('fluxo completo: docente convida, pessoa se cadastra e entra', async () => {
    const token = await loginToken();

    // 1. quem já é docente gera o convite
    const convite = await request(app)
      .post('/auth/invites')
      .set({ Authorization: `Bearer ${token}` })
      .send({ expiresInDays: 7 });

    expect(convite.status).toBe(201);
    expect(convite.body.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(convite.body.status).toBe('ativo');

    // 2. a pessoa convidada se cadastra e já recebe o token
    const cadastro = await request(app).post('/auth/register').send({
      name: 'Prof. Convidado',
      email: 'convidado@blog.dev',
      password: 'senhaforte1',
      code: convite.body.code,
    });

    expect(cadastro.status).toBe(201);
    expect(cadastro.body.user.email).toBe('convidado@blog.dev');
    expect(cadastro.body.user.passwordHash).toBeUndefined();

    // 3. o token do cadastro já serve para publicar
    const post = await request(app)
      .post('/posts')
      .set({ Authorization: `Bearer ${cadastro.body.token}` })
      .send({
        title: 'Primeiro post do convidado',
        content: 'conteúdo',
        author: 'Prof. Convidado',
      });

    expect(post.status).toBe(201);
    await prisma.post.deleteMany();

    // 4. e o login normal funciona depois
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'convidado@blog.dev', password: 'senhaforte1' });

    expect(login.status).toBe(200);

    // 5. o convite não vale uma segunda vez
    const reuso = await request(app).post('/auth/register').send({
      name: 'Outra Pessoa',
      email: 'outra@blog.dev',
      password: 'senhaforte1',
      code: convite.body.code,
    });

    expect(reuso.status).toBe(400);
    expect(reuso.body.message).toMatch(/já foi utilizado/i);

    await prisma.user.deleteMany({ where: { email: 'convidado@blog.dev' } });
  });

  it('POST /auth/register cria a conta sem informar convite', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Prof. Sem Convite',
      email: 'semconvite@blog.dev',
      password: 'senhaforte1',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('semconvite@blog.dev');
    expect(typeof res.body.token).toBe('string');

    // E o token já serve para publicar.
    const post = await request(app)
      .post('/posts')
      .set({ Authorization: `Bearer ${res.body.token}` })
      .send({ title: 'Oi', content: 'texto', author: 'Prof. Sem Convite' });

    expect(post.status).toBe(201);

    await prisma.post.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'semconvite@blog.dev' } });
  });

  it('POST /auth/register ainda recusa um código informado e inválido', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Prof. Codigo Errado',
      email: 'codigoerrado@blog.dev',
      password: 'senhaforte1',
      code: 'ZZZZ-ZZZZ-ZZZZ',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/convite inválido/i);
  });

  it('POST /auth/register valida nome, e-mail e senha', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'ab', email: 'nao-e-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });

  it('convite nominal só aceita o e-mail indicado', async () => {
    const token = await loginToken();

    const convite = await request(app)
      .post('/auth/invites')
      .set({ Authorization: `Bearer ${token}` })
      .send({ email: 'indicada@blog.dev' });

    const res = await request(app).post('/auth/register').send({
      name: 'Pessoa Errada',
      email: 'errada@blog.dev',
      password: 'senhaforte1',
      code: convite.body.code,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/outro e-mail/i);
  });

  it('cadastro com e-mail já existente devolve 409', async () => {
    const token = await loginToken();

    const convite = await request(app)
      .post('/auth/invites')
      .set({ Authorization: `Bearer ${token}` })
      .send({});

    const res = await request(app).post('/auth/register').send({
      name: 'Clone do Teste',
      email: testTeacher.email,
      password: 'senhaforte1',
      code: convite.body.code,
    });

    expect(res.status).toBe(409);
  });

  it('GET /auth/invites lista os convites para quem está autenticado', async () => {
    const token = await loginToken();

    await request(app)
      .post('/auth/invites')
      .set({ Authorization: `Bearer ${token}` })
      .send({});

    const semToken = await request(app).get('/auth/invites');
    expect(semToken.status).toBe(401);

    const res = await request(app)
      .get('/auth/invites')
      .set({ Authorization: `Bearer ${token}` });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('ativo');
  });
});
