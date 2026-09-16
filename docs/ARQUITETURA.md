# Arquitetura do sistema

## Visão geral

A aplicação tem duas partes: uma API REST stateless escrita em Node.js com
TypeScript, que guarda as postagens num PostgreSQL usando o Prisma como ORM, e
uma SPA em React que consome essa API. O código das duas é dividido em camadas,
tanto para separar responsabilidades quanto para facilitar os testes.

```
┌─────────────────────────────────────────────────────────────┐
│  Front-end React (web/) — SPA servida pelo nginx              │
│  páginas → services → fetch (token JWT no Authorization)      │
└───────────────────────────────┬─────────────────────────────┘
                                 │  JSON / REST
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Express App (app.ts)                                         │
│  ├─ cors, express.json                                        │
│  ├─ /health            (healthcheck)                          │
│  ├─ /docs              (Swagger UI)                           │
│  ├─ /auth              (authRoutes: login e me)               │
│  ├─ /posts             (postsRoutes; escrita exige requireAuth)│
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
| Middlewares  | `src/middlewares/auth.middleware.ts`    | `requireAuth`: exige o JWT nas rotas de escrita.             |
| Auth         | `src/services/auth.service.ts`          | Login (bcrypt + JWT), cadastro por convite, perfil e verificação de token. |
| Repositories | `src/repositories/users.repository.ts`  | Docentes.                                                    |
| Repositories | `src/repositories/invites.repository.ts`| Convites de cadastro.                                        |
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

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}

model Invite {
  id        String    @id @default(uuid())
  code      String    @unique
  email     String?
  expiresAt DateTime
  usedAt    DateTime?
  createdBy String?
  usedBy    String?
  createdAt DateTime  @default(now())

  @@map("invites")
}
```

`createdBy` e `usedBy` guardam ids de docentes como texto, sem relação formal:
o histórico de quem convidou quem continua legível mesmo que a conta seja
excluída depois.

O post guarda o autor como texto livre (`author`), e não como relação com
`User`. Foi uma escolha consciente: a API da fase anterior já expunha esse campo
e a interface permite publicar em nome de outra pessoa (por exemplo, uma
secretaria postando pela professora). O vínculo com o usuário é de autenticação,
não de autoria.

## Fluxo de erros

Nenhum controller responde erro diretamente: todos chamam `next(err)`, e o
middleware central decide o status:

- `ZodError` vira 400 (falha de validação).
- `AppError`, `NotFoundError` e `UnauthorizedError` usam o próprio status
  (400, 404 e 401).
- O `P2025` do Prisma (registro inexistente) também vira 404.
- Qualquer outro erro cai em 500.

## Autenticação

O login é stateless, com JWT:

```
POST /auth/login ──► AuthService.login
                       ├─ usersRepository.findByEmail (e-mail em minúsculas)
                       ├─ bcrypt.compare(senha, passwordHash)
                       └─ jwt.sign({ sub, name, email })  ──► token
                                                                │
rotas de escrita ◄── requireAuth ◄── Authorization: Bearer ─────┘
```

Quem ainda não tem conta se cadastra (extra em relação ao enunciado, que pede só
o login e a proteção das rotas):

```
POST /auth/register { nome, email, senha, código? }
        ├─ informou código? valida: existe, não usado, não expirou, e-mail bate
        ├─ e-mail ainda não cadastrado? (senão 409)
        ├─ cria o usuário com hash bcrypt
        ├─ marca o convite como usado (quando houve código)
        └─ devolve o token (a pessoa entra direto)

POST /auth/invites (requireAuth) ──► código XXXX-XXXX-XXXX + validade,
                                     para o link /cadastro?convite=<código>
```

Decisões que valem registrar:

- **O cadastro é aberto**: nome, e-mail e senha bastam. Em uma implantação real
  isso pediria aprovação da coordenação ou restrição por domínio de e-mail,
  porque hoje qualquer pessoa que chegue na tela vira docente e publica.
- O **convite é opcional** e serve para indicar alguém nominalmente e registrar
  quem entrou por indicação. Para voltar a usá-lo como barreira, basta tornar o
  `code` obrigatório no `registerSchema` e no `register` do service.
- Qualquer docente pode convidar: o domínio tem um papel só, e criar um nível de
  "administrador" seria complexidade sem requisito que a peça.
- O convite vale uma vez, expira e pode ser nominal (preso a um e-mail).
- **Não há vínculo com instituição.** O blog é de uma escola/rede só; vincular
  posts e usuários a instituições significaria multi-tenancy (filtro em toda
  consulta e autorização por instituição), o que reescreveria o domínio sem que
  o problema peça isso.

- O `AuthService` também recebe o repositório por injeção, então o login é
  testável sem banco.
- E-mail inexistente e senha errada devolvem exatamente a mesma resposta 401,
  para a API não revelar quais e-mails estão cadastrados.
- Só o hash da senha vai para o banco (bcrypt, custo 10) e ele nunca aparece em
  nenhuma resposta.
- A leitura (`GET`) continua pública: o blog precisa ser aberto aos estudantes.

## Arquitetura do front-end

A SPA fica em `web/` e segue a mesma lógica de camadas da API:

```
pages/ (uma por rota)
   │  usa hooks
   ▼
hooks/ (useAuth, useAsyncResource, useDebouncedValue)
   │
   ▼
services/ (http, posts, auth, session) ──► API REST
```

- `contexts/AuthProvider` guarda a sessão via Context API e revalida o token em
  `GET /auth/me` a cada carregamento.
- `components/ProtectedRoute` fecha as rotas de criação, edição e administração.
- `services/http` é o único lugar com `fetch`: monta a URL, injeta o token,
  trata 204 e converte falhas em `ApiError`.
- A estilização é toda em styled-components, com o tema (cores, espaçamentos e
  breakpoints) centralizado em `styles/theme.ts`.

O detalhamento está em [`../web/README.md`](../web/README.md).

## Containerização

O Dockerfile da API é multi-stage: um estágio compila o TypeScript e gera o
Prisma Client, e o estágio final leva apenas o `dist` e as dependências de
produção, o que deixa a imagem menor.

O front-end tem o próprio Dockerfile, também multi-stage: o primeiro estágio
roda o build do Vite e o segundo serve o `dist/` com nginx, configurado com
fallback para o `index.html` — sem isso, abrir `/admin` direto pela URL daria
404, porque quem conhece essa rota é o React Router, no cliente.

O `docker-compose.yml` sobe os três serviços (banco, API e front-end), com
healthcheck no Postgres e as migrations sendo aplicadas quando a API inicia.
A `VITE_API_URL` entra como build arg: o bundle é estático, então a URL da API
precisa ser a que o **navegador** enxerga (`localhost:3000`), e não o nome do
serviço na rede interna do compose.
