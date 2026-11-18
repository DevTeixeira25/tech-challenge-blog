// A suíte de integração limpa tabelas: recuse bancos que não sejam de teste.
const currentTestPath = expect.getState().testPath || '';
if (currentTestPath.includes('.e2e.test.')) {
  const connection = process.env.DATABASE_URL;
  const database = connection ? decodeURIComponent(new URL(connection).pathname.slice(1)) : '';
  if (!/(^|[_-])test(s)?($|[_-])/i.test(database)) {
    throw new Error('Testes de integração exigem DATABASE_URL de banco exclusivo com test no nome (ex.: blog_fase4_test). O banco informado não será alterado.');
  }
}
