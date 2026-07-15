import { PrismaClient } from '@prisma/client';

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

async function main() {
  console.log('Populando o banco com posts de exemplo...');
  // Limpa antes para o seed poder rodar mais de uma vez sem duplicar
  await prisma.post.deleteMany();
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
