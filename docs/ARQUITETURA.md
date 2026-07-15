# Arquitetura do Sistema

## Visão geral

A aplicação é uma **API REST** stateless em Node.js/TypeScript que persiste
postagens em um banco **PostgreSQL** através do ORM **Prisma**. O desenho segue
o padrão de **camadas** para separar responsabilidades e maximizar a
testabilidade.

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

| Camada          | Arquivo                                | Responsabilidade                                              |
| --------------- | -------------------------------------- | ------------------------------------------------------------- |
| **Routes**      | `src/routes/posts.routes.ts`           | Mapeia URLs → controller. `/search` declarada antes de `/:id`. |
| **Controllers** | `src/controllers/posts.controller.ts`  | Traduz HTTP ↔ service; valida entrada com Zod.                |
| **Services**    | `src/services/posts.service.ts`         | Regra de negócio (ex.: 404 quando não existe). Injeção de repo. |
| **Repositories**| `src/repositories/posts.repository.ts` | Único ponto que fala com o Prisma.                            |
| **Schemas**     | `src/schemas/post.schema.ts`            | Validação Zod (create/update/search).                        |
| **Middlewares** | `src/middlewares/error.middleware.ts`   | 404 e tratamento central de erros.                           |
| **Errors**      | `src/errors/AppError.ts`                | Erros de domínio com status HTTP.                            |
| **Config**      | `src/config/env.ts`                     | Validação das variáveis de ambiente (Zod).                   |
| **Lib**         | `src/lib/prisma.ts`                     | Singleton do PrismaClient.                                    |
| **Docs**        | `src/docs/openapi.ts`                   | Especificação OpenAPI (Swagger).                             |

## Por que separar `app.ts` de `server.ts`?

`app.ts` **cria** a aplicação Express (sem abrir porta) e `server.ts` apenas a
sobe com `listen`. Isso permite que os testes de integração (Supertest)
importem a app diretamente, sem subir um servidor real.

## Por que injeção de dependência no Service?

`PostsService` recebe o repositório no construtor (default = repositório real).
Nos testes unitários passamos um **mock**, isolando a regra de negócio do banco
de dados — testes rápidos e determinísticos.

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

Todos os erros são encaminhados via `next(err)` ao middleware central, que
padroniza a resposta:

- `ZodError` → **400** (validação)
- `AppError` / `NotFoundError` → status próprio (ex.: **404**)
- `PrismaClientKnownRequestError` código `P2025` → **404**
- qualquer outro → **500**

## Containerização

- **Dockerfile** multi-stage: um estágio compila o TypeScript e gera o Prisma
  Client; o estágio final contém só o `dist` e dependências de produção →
  imagem menor e mais segura.
- **docker-compose.yml** orquestra `db` (Postgres) + `app`, com healthcheck no
  banco e aplicação de migrations no start.
