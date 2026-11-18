import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { newPasswordSchema } from '../src/schemas/password.schema';

const prisma = new PrismaClient();

const posts = [
  {
    title: 'Bem-vindos ao blog da turma!',
    content:
      'Este é o primeiro post da nossa plataforma. Aqui os docentes vão compartilhar aulas, materiais e novidades com toda a turma.',
    author: 'Prof. Ana Souza',
  },
  {
    title: 'Introdução à fotossíntese',
    content:
      'A fotossíntese é o processo pelo qual as plantas convertem luz solar, água e gás carbônico em energia. Nesta aula vamos entender cada etapa.',
    author: 'Prof. Carlos Lima',
  },
  {
    title: 'Revolução Francesa: um resumo',
    content:
      'A Revolução Francesa (1789) transformou a política mundial. Neste post reunimos os principais fatos, causas e consequências.',
    author: 'Profa. Mariana Alves',
  },
];

// Contas exclusivas de demonstração; repetir o seed preserva todas as contas existentes.
const people = [
  { name: 'Prof. Ana Souza', email: 'ana@blog.dev', password: 'senha123', role: Role.TEACHER },
  { name: 'Prof. Carlos Lima', email: 'carlos@blog.dev', password: 'senha123', role: Role.TEACHER },
  { name: 'Aluno Demonstração', email: 'aluno@blog.dev', password: 'aluno1234', role: Role.STUDENT },
  ...Array.from({ length: 12 }, (_, index) => ({
    name: `Docente Exemplo ${String(index + 1).padStart(2, '0')}`,
    email: `docente${index + 1}@demo.blog.dev`, password: 'docente123', role: Role.TEACHER,
  })),
  ...Array.from({ length: 12 }, (_, index) => ({
    name: `Estudante Exemplo ${String(index + 1).padStart(2, '0')}`,
    email: `estudante${index + 1}@demo.blog.dev`, password: 'estudante123', role: Role.STUDENT,
  })),
];

async function main() {
  console.log('Adicionando pessoas e posts de demonstração sem excluir dados...');
  for (const person of people) {
    const { password, ...data } = person;
    newPasswordSchema.parse(password);
    await prisma.user.upsert({
      where: { email: data.email }, update: {},
      create: { ...data, passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`  ${data.role}: ${data.email} (senha inicial: ${password})`);
  }
  for (const post of posts) {
    const existing = await prisma.post.findFirst({ where: { title: post.title, author: post.author } });
    if (!existing) await prisma.post.create({ data: post });
  }
  console.log('Seed concluído. Contas existentes mantêm suas credenciais e perfis.');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
