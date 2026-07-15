# Relato de Experiências e Desafios

> Projeto desenvolvido **individualmente** (equipe de 1 integrante).

## Contexto

A aplicação nasceu na fase anterior em **OutSystems** (low-code) e precisou ser
**refatorada para Node.js** com persistência em banco de dados, visando escala
nacional. A migração exigiu repensar a arquitetura de forma explícita, já que o
low-code abstraía boa parte das camadas.

## Decisões técnicas

- **PostgreSQL + Prisma**: escolhi um banco relacional pela integridade dos
  dados e pela ótima experiência de desenvolvimento do Prisma (tipagem, migrations
  versionadas e client gerado).
- **TypeScript**: tipagem estática reduz erros e melhora a manutenção.
- **Arquitetura em camadas** (controller/service/repository): permitiu testar a
  regra de negócio isoladamente com mocks.

## Desafios enfrentados

1. **Ordem das rotas no Express**: `GET /posts/search` era capturada por
   `GET /posts/:id` (interpretando "search" como um id). Resolvi declarando a
   rota `/search` **antes** de `/:id`.
2. **Tratamento consistente de erros**: centralizei em um middleware único que
   traduz `ZodError`, erros de domínio (`NotFoundError`) e erros do Prisma
   (`P2025`) em respostas HTTP padronizadas.
3. **Testabilidade x banco de dados**: separei `app.ts` de `server.ts` para os
   testes de integração subirem a aplicação sem abrir porta, e injetei o
   repositório no service para os testes unitários rodarem sem banco.
4. **Prisma dentro do Alpine (o desafio mais instrutivo)**: ao subir o
   `docker compose`, o container da API entrava em *loop de restart* com o erro
   `Could not parse schema engine response`. O build da imagem passava no CI, mas
   o container só quebrava **em tempo de execução** — ou seja, o pipeline verde
   não garantia que a aplicação rodava. A causa: a imagem `node:20-alpine` (musl)
   não trazia o OpenSSL e o Prisma não conseguia carregar o *query engine*.
   Resolvi instalando `openssl`/`libc6-compat` na imagem e declarando o binary
   target `linux-musl-openssl-3.0.x` no `schema.prisma`. Lição: validar a
   aplicação **rodando de fato**, não só o build.
5. **Consistência entre ambientes**: Docker multi-stage + docker-compose
   garantem que a aplicação rode igual em dev, CI e produção, com migrations
   aplicadas automaticamente no start.
6. **CI/CD**: configurar um PostgreSQL como *service* no GitHub Actions para os
   testes de integração rodarem contra um banco real a cada push/PR.
7. **Conflito de porta do PostgreSQL no ambiente local**: ao rodar a suíte de
   testes de integração na minha máquina, todos os testes e2e falhavam com
   `Authentication failed against database server at localhost`. O CI, porém,
   estava verde. A causa era um **conflito de porta**: já havia um PostgreSQL
   instalado no host ocupando a `5432`, então as conexões locais iam para o
   servidor errado (credenciais diferentes), enquanto no CI o único Postgres era
   o do pipeline. Resolvi expondo o banco do `docker-compose` na porta **`5433`**
   do host (`5433:5432`) — mantendo `5432` interno para o container — e apontando
   o `DATABASE_URL` local para `localhost:5433`. Também configurei o Jest para
   carregar o `.env` automaticamente (`setupFiles: ['dotenv/config']`). Lição:
   divergências entre ambiente local e CI muitas vezes são de infraestrutura
   (portas, credenciais, rede), não de código.

## Aprendizados

- A separação em camadas paga o custo inicial ao facilitar testes e evolução.
- Migrations versionadas evitam divergência de schema entre os ambientes.
- Um pipeline de CI verde no *build* não substitui rodar a aplicação de verdade:
  bugs de runtime (como o do Prisma/Alpine) só aparecem executando o container.
- Investir em documentação (README + Swagger) reduz o atrito de uso da API.

## Divisão de tarefas

Projeto desenvolvido individualmente. Todas as etapas foram executadas pelo
único integrante:

| Integrante       | Responsabilidades                                                                 |
| ---------------- | --------------------------------------------------------------------------------- |
| Jefferson Costa  | Arquitetura, API (Express/TS), banco (Prisma/PostgreSQL), Docker, CI/CD, testes e documentação |
