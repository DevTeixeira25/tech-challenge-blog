# Arquitetura do sistema

## Visão geral

A aplicação é uma API REST stateless escrita em Node.js com TypeScript. Ela
guarda as postagens num PostgreSQL usando o Prisma como ORM. O código é dividido
em camadas, tanto para separar responsabilidades quanto para facilitar os testes.

```
┌─────────────────────────────────────────────────────────────┐
│                          Cliente HTTP                         │
└───────────────────────────────┬─────────────────────────────┘
                                 │  JSON / REST
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Express App (app.ts)                                         │
│  ├─ cors, express.json                                        │
│  ├─ /health            (healthcheck)                          │
│  ├─ /docs              (Swagger UI)                           │
│  ├─ /posts             (postsRoutes)                          │
│  └─ error middleware   (404 + tratamento central)            │
└───────────────────────────────┬─────────────────────────────┘
                                 ▼
        routes ─► controller ─► service ─► repository ─► Prisma
                  (HTTP+Zod)    (negócio)   (dados)       │
                                                          ▼
                                                    PostgreSQL
```

## Camadas e responsabilidades

| Camada       | Arquivo                                | Responsabilidade                                              |
| ------------ | -------------------------------------- | ------------------------------------------------------------- |
| Routes       | `src/routes/posts.routes.ts`           | Mapeia as URLs para o controller. A `/search` vem antes da `/:id`. |
| Controllers  | `src/controllers/posts.controller.ts`  | Ponte entre HTTP e service; valida a entrada com Zod.         |
| Services     | `src/services/posts.service.ts`         | Regra de negócio (ex.: 404 quando não existe). Recebe o repo por injeção. |
| Repositories | `src/repositories/posts.repository.ts` | Único ponto que fala com o Prisma.                            |
| Schemas      | `src/schemas/post.schema.ts`            | Validação Zod (create, update e search).                     |
| Middlewares  | `src/middlewares/error.middleware.ts`   | Rota 404 e tratamento central de erros.                      |
| Errors       | `src/errors/AppError.ts`                | Erros de domínio com o status HTTP embutido.                 |
| Config       | `src/config/env.ts`                     | Validação das variáveis de ambiente com Zod.                 |
| Lib          | `src/lib/prisma.ts`                     | Singleton do PrismaClient.                                    |
| Docs         | `src/docs/openapi.ts`                   | Especificação OpenAPI usada pelo Swagger.                    |

## Separação entre app.ts e server.ts

O `app.ts` monta a aplicação Express, mas não abre nenhuma porta. Quem faz o
`listen` é o `server.ts`. Essa divisão existe para os testes de integração:
o Supertest importa a app direto e faz as requisições sem precisar subir um
servidor de verdade.

## Injeção de dependência no service

O `PostsService` recebe o repositório pelo construtor, com o repositório real
como padrão. Nos testes unitários eu passo um mock no lugar, o que isola a regra
de negócio do banco e deixa os testes rápidos e previsíveis.

## Modelo de dados

```prisma
model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  author    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([title])
  @@map("posts")
}
```

## Fluxo de erros

Nenhum controller responde erro diretamente: todos chamam `next(err)`, e o
middleware central decide o status:

- `ZodError` vira 400 (falha de validação).
- `AppError` e `NotFoundError` usam o próprio status (por exemplo, 404).
- O `P2025` do Prisma (registro inexistente) também vira 404.
- Qualquer outro erro cai em 500.

## Containerização

O Dockerfile é multi-stage: um estágio compila o TypeScript e gera o Prisma
Client, e o estágio final leva apenas o `dist` e as dependências de produção, o
que deixa a imagem menor. O `docker-compose.yml` sobe o banco e a API juntos, com
healthcheck no Postgres e as migrations sendo aplicadas quando a API inicia.
