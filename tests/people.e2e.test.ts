import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { env } from '../src/config/env';
import { authService } from '../src/services/auth.service';
import { createTestTeacher, loginTestTeacher } from './helpers/auth';

const app = createApp();
const personInput = { name: 'Pessoa Teste', email: 'pessoa@example.test', password: 'senhaforte123' };
let teacherId: string;
let token: string;
const auth = () => ({ Authorization: `Bearer ${token}` });

beforeEach(async () => {
  await prisma.invite.deleteMany();
  await prisma.user.deleteMany();
  teacherId = (await createTestTeacher()).id;
  token = await loginTestTeacher(app);
});
afterAll(async () => {
  await prisma.invite.deleteMany();
  await prisma.user.deleteMany();
  await prisma.post.deleteMany();
  await prisma.$disconnect();
});

describe.each([['teachers', Role.TEACHER], ['students', Role.STUDENT]])('%s API', (route, role) => {
  it('cria, consulta, atualiza senha/e-mail e remove sem expor hash', async () => {
    const created = await request(app).post(`/${route}`).set(auth()).send(personInput);
    expect(created.status).toBe(201);
    expect(created.body).toEqual({ id: expect.any(String), name: personInput.name, email: personInput.email, role });
    const id = created.body.id;
    const stored = await prisma.user.findUniqueOrThrow({ where: { id } });
    expect(await bcrypt.compare(personInput.password, stored.passwordHash)).toBe(true);
    expect((await request(app).get(`/${route}/${id}`).set(auth())).body).toEqual(created.body);
    const updated = await request(app).put(`/${route}/${id}`).set(auth()).send({
      name: 'Pessoa Atualizada', email: 'ATUALIZADA@example.test', password: 'outrasenha123',
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual({ id, name: 'Pessoa Atualizada', email: 'atualizada@example.test', role });
    expect((await request(app).post('/auth/login').send({ email: personInput.email, password: personInput.password })).status).toBe(401);
    const login = await request(app).post('/auth/login').send({ email: updated.body.email, password: 'outrasenha123' });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe(role);
    expect((await request(app).get('/auth/me').set('Authorization', `Bearer ${login.body.token}`)).body).toEqual(updated.body);
    expect((await request(app).delete(`/${route}/${id}`).set(auth())).status).toBe(204);
    expect((await request(app).get(`/${route}/${id}`).set(auth())).status).toBe(404);
    expect((await request(app).get('/auth/me').set('Authorization', `Bearer ${login.body.token}`)).status).toBe(401);
  });

  it('pagina com ordem estável e filtra somente o perfil da rota', async () => {
    const passwordHash = await bcrypt.hash(personInput.password, 4);
    await prisma.user.createMany({ data: Array.from({ length: 12 }, (_, index) => ({
      name: `AAA Pessoa ${String(index).padStart(2, '0')}`, email: `pessoa${index}@example.test`, passwordHash, role,
    })) });
    const first = await request(app).get(`/${route}`).set(auth());
    const second = await request(app).get(`/${route}?page=2&pageSize=10`).set(auth());
    const expectedTotal = role === Role.TEACHER ? 13 : 12;
    expect(first.body).toMatchObject({ page: 1, pageSize: 10, total: expectedTotal, totalPages: 2 });
    expect(second.body).toMatchObject({ page: 2, pageSize: 10, total: expectedTotal, totalPages: 2 });
    expect(first.body.items).toHaveLength(10);
    expect(second.body.items).toHaveLength(expectedTotal - 10);
    const items = [...first.body.items, ...second.body.items];
    expect(new Set(items.map((item: { id: string }) => item.id)).size).toBe(expectedTotal);
    for (const item of items) {
      expect(Object.keys(item).sort()).toEqual(['email', 'id', 'name', 'role']);
      expect(item.role).toBe(role);
    }
    const beyond = await request(app).get(`/${route}?page=100`).set(auth());
    expect(beyond.body.items).toEqual([]);
    for (const query of ['page=0', 'page=1.5', 'page=abc', 'pageSize=0', 'pageSize=101']) {
      expect((await request(app).get(`/${route}?${query}`).set(auth())).status).toBe(400);
    }
  });

  it('rejeita senha curta, duplicidade, alteração de perfil e edição vazia', async () => {
    expect((await request(app).post(`/${route}`).set(auth()).send({ ...personInput, password: '1234567' })).status).toBe(400);
    expect((await request(app).post(`/${route}`).set(auth()).send({ ...personInput, role: 'TEACHER' })).status).toBe(400);
    const created = await request(app).post(`/${route}`).set(auth()).send(personInput);
    const other = await request(app).post(`/${route}`).set(auth()).send({ ...personInput, email: 'other@example.test' });
    expect((await request(app).post(`/${route}`).set(auth()).send(personInput)).status).toBe(409);
    expect((await request(app).put(`/${route}/${other.body.id}`).set(auth()).send({ email: personInput.email })).status).toBe(409);
    for (const body of [{}, { role: 'STUDENT' }, { password: '1234567' }]) {
      expect((await request(app).put(`/${route}/${created.body.id}`).set(auth()).send(body)).status).toBe(400);
    }
    const otherRoute = route === 'teachers' ? 'students' : 'teachers';
    expect((await request(app).get(`/${otherRoute}/${created.body.id}`).set(auth())).status).toBe(404);
    expect((await request(app).put(`/${otherRoute}/${created.body.id}`).set(auth()).send({ name: 'Outro Nome' })).status).toBe(404);
    expect((await request(app).delete(`/${otherRoute}/${created.body.id}`).set(auth())).status).toBe(404);
  });

  it('exige autenticação em todas as operações', async () => {
    expect((await request(app).get(`/${route}`)).status).toBe(401);
    expect((await request(app).post(`/${route}`).send(personInput)).status).toBe(401);
    expect((await request(app).get(`/${route}/${teacherId}`)).status).toBe(401);
    expect((await request(app).put(`/${route}/${teacherId}`).send({ name: 'Outro Nome' })).status).toBe(401);
    expect((await request(app).delete(`/${route}/${teacherId}`)).status).toBe(401);
  });
});

describe('Autorização por perfil atual do banco', () => {
  it('cadastro público ignora tentativa de perfil docente e nega operações administrativas', async () => {
    const registered = await request(app).post('/auth/register').send({ ...personInput, role: 'TEACHER' });
    expect(registered.status).toBe(201);
    expect(registered.body.user.role).toBe('STUDENT');
    const forged = jwt.sign({ sub: registered.body.user.id, role: 'TEACHER', name: 'Docente', email: personInput.email }, env.JWT_SECRET);
    const header = { Authorization: `Bearer ${forged}` };
    expect((await request(app).get('/auth/me').set(header)).body.role).toBe('STUDENT');
    for (const route of ['teachers', 'students']) {
      expect((await request(app).get(`/${route}`).set(header)).status).toBe(403);
      expect((await request(app).post(`/${route}`).set(header).send(personInput)).status).toBe(403);
      expect((await request(app).get(`/${route}/${teacherId}`).set(header)).status).toBe(403);
      expect((await request(app).put(`/${route}/${teacherId}`).set(header).send({ name: 'Outro Nome' })).status).toBe(403);
      expect((await request(app).delete(`/${route}/${teacherId}`).set(header)).status).toBe(403);
    }
    expect((await request(app).post('/auth/invites').set(header).send({})).status).toBe(403);
    expect((await request(app).get('/auth/invites').set(header)).status).toBe(403);
    expect((await request(app).post('/posts').set(header).send({})).status).toBe(403);
    expect((await request(app).put('/posts/any').set(header).send({})).status).toBe(403);
    expect((await request(app).delete('/posts/any').set(header)).status).toBe(403);
    expect((await request(app).get('/posts').set(header)).status).toBe(200);
  });

  it('bloqueia autoexclusão e respeita mudança de perfil mesmo com token anterior', async () => {
    expect((await request(app).delete(`/teachers/${teacherId}`).set(auth())).status).toBe(409);
    await prisma.user.update({ where: { id: teacherId }, data: { role: 'STUDENT', name: 'Nome Atualizado' } });
    const me = await request(app).get('/auth/me').set(auth());
    expect(me.body.role).toBe('STUDENT');
    expect(me.body.name).toBe('Nome Atualizado');
    expect((await request(app).post('/posts').set(auth()).send({})).status).toBe(403);
    expect((await request(app).get('/teachers').set(auth())).status).toBe(403);
  });

  it('preserva docente quando os dois últimos docentes tentam excluir um ao outro', async () => {
    const second = await request(app).post('/teachers').set(auth()).send(personInput);
    expect(second.status).toBe(201);
    const secondLogin = await request(app).post('/auth/login').send({ email: personInput.email, password: personInput.password });
    // Ambos passam pela autenticação antes de qualquer exclusão começar.
    // Assim o teste exige revalidar o ator dentro da transação, após o lock.
    const originalGetProfile = authService.getProfile.bind(authService);
    let authenticated = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const profileSpy = jest.spyOn(authService, 'getProfile').mockImplementation(async (id) => {
      const profile = await originalGetProfile(id);
      if (++authenticated === 2) release();
      await gate;
      return profile;
    });
    try {
      const results = await Promise.all([
        request(app).delete(`/teachers/${second.body.id}`).set(auth()),
        request(app).delete(`/teachers/${teacherId}`).set('Authorization', `Bearer ${secondLogin.body.token}`),
      ]);
      expect(results.map((result) => result.status).sort()).toEqual([204, 401]);
    } finally { profileSpy.mockRestore(); }
    const remaining = await prisma.user.findMany({ where: { role: 'TEACHER' } });
    expect(remaining).toHaveLength(1);
    const survivingToken = remaining[0].id === teacherId ? token : secondLogin.body.token;
    expect((await request(app).get('/teachers').set('Authorization', `Bearer ${survivingToken}`)).status).toBe(200);
  });

  it('revoga tokens de pessoa removida em toda rota protegida', async () => {
    await prisma.user.delete({ where: { id: teacherId } });
    expect((await request(app).get('/auth/me').set(auth())).status).toBe(401);
    expect((await request(app).get('/teachers').set(auth())).status).toBe(401);
    expect((await request(app).post('/posts').set(auth()).send({})).status).toBe(401);
    expect((await request(app).post('/auth/invites').set(auth()).send({})).status).toBe(401);
    const invalidSubject = jwt.sign({ role: 'TEACHER' }, env.JWT_SECRET);
    expect((await request(app).get('/auth/me').set('Authorization', `Bearer ${invalidSubject}`)).status).toBe(401);
  });
});
