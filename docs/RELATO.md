# Relato de Experiências e Desafios

> Documento exigido na entrega. Preencha com a experiência real do grupo antes
> de submeter. Abaixo há um rascunho com os pontos técnicos já enfrentados no
> desenvolvimento, que vocês podem ajustar.

## Contexto

A aplicação nasceu na fase anterior em **OutSystems** (low-code) e precisou ser
**refatorada para Node.js** com persistência em banco de dados, visando escala
nacional. A migração exigiu repensar a arquitetura de forma explícita, já que o
low-code abstraía boa parte das camadas.

## Decisões técnicas

- **PostgreSQL + Prisma**: optamos por um banco relacional pela integridade dos
  dados e pela ótima experiência de desenvolvimento do Prisma (tipagem, migrations
  versionadas e client gerado). 
- **TypeScript**: tipagem estática reduz erros e melhora a manutenção.
- **Arquitetura em camadas** (controller/service/repository): permitiu testar a
  regra de negócio isoladamente com mocks.

## Desafios enfrentados

1. **Ordem das rotas no Express**: `GET /posts/search` era capturada por
   `GET /posts/:id` (interpretando "search" como um id). Resolvido declarando a
   rota `/search` **antes** de `/:id`.
2. **Tratamento consistente de erros**: centralizamos em um middleware único que
   traduz `ZodError`, erros de domínio (`NotFoundError`) e erros do Prisma
   (`P2025`) em respostas HTTP padronizadas.
3. **Testabilidade x banco de dados**: separamos `app.ts` de `server.ts` para os
   testes de integração subirem a aplicação sem abrir porta, e injetamos o
   repositório no service para os testes unitários rodarem sem banco.
4. **Consistência entre ambientes**: Docker multi-stage + docker-compose
   garantem que a aplicação rode igual em dev, CI e produção, com migrations
   aplicadas automaticamente no start.
5. **CI/CD**: configurar um PostgreSQL como *service* no GitHub Actions para os
   testes de integração rodarem contra um banco real a cada push/PR.

## Aprendizados

- A separação em camadas paga o custo inicial ao facilitar testes e evolução.
- Migrations versionadas evitam divergência de schema entre os ambientes.
- Investir em documentação (README + Swagger) reduz o atrito de uso da API.

## Divisão de tarefas (preencher)

| Integrante | Responsabilidades |
| ---------- | ----------------- |
|            |                   |
|            |                   |
