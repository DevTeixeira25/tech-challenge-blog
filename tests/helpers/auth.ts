import bcrypt from 'bcryptjs';
import request from 'supertest';
import { Application } from 'express';
import { prisma } from '../../src/lib/prisma';

/** Credenciais do docente usado nos testes de integração. */
export const testTeacher = {
  name: 'Prof. Teste',
  email: 'teste@blog.dev',
  password: 'senha123',
};

/** Cria (ou recria) o docente de teste no banco. */
export async function createTestTeacher() {
  const passwordHash = await bcrypt.hash(testTeacher.password, 10);
  return prisma.user.upsert({
    where: { email: testTeacher.email },
    update: { passwordHash, name: testTeacher.name },
    create: {
      name: testTeacher.name,
      email: testTeacher.email,
      passwordHash,
    },
  });
}

/** Faz login e devolve o token JWT do docente de teste. */
export async function loginTestTeacher(app: Application): Promise<string> {
  const res = await request(app).post('/auth/login').send({
    email: testTeacher.email,
    password: testTeacher.password,
  });

  if (res.status !== 200) {
    throw new Error(`Login de teste falhou: ${res.status} ${res.text}`);
  }

  return res.body.token as string;
}
