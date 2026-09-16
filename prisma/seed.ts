import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

// Senhas em texto claro só aqui, para o ambiente de desenvolvimento:
// no banco é gravado apenas o hash bcrypt.
const teachers = [
  { name: 'Prof. Ana Souza', email: 'ana@blog.dev', password: 'senha123' },
  { name: 'Prof. Carlos Lima', email: 'carlos@blog.dev', password: 'senha123' },
];

async function main() {
  console.log('Populando o banco com docentes e posts de exemplo...');

  // Limpa antes para o seed poder rodar mais de uma vez sem duplicar
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  for (const teacher of teachers) {
    const passwordHash = await bcrypt.hash(teacher.password, 10);
    const created = await prisma.user.create({
      data: {
        name: teacher.name,
        email: teacher.email,
        passwordHash,
      },
    });
    console.log(`  docente: ${created.email} (senha: ${teacher.password})`);
  }

  for (const post of posts) {
    const created = await prisma.post.create({ data: post });
    console.log(`  criado: ${created.title}`);
  }

  console.log('Seed concluido.');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
