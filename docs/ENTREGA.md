# Entrega — Tech Challenge FIAP (fase 3)

Documento de entrega do projeto **Blog dos Docentes**: o que foi entregue, onde
cada requisito do enunciado está cumprido e como avaliar a aplicação rodando.

- **Repositório**: https://github.com/DevTeixeira25/tech-challenge-blog
- **Vídeo de apresentação**: _(link a adicionar após a gravação)_
- **Autor**: Jefferson de Oliveira da Costa Teixeira (projeto individual)

---

## 1. Código-fonte

Um repositório com as duas partes da aplicação:

```
.
├── src/                  API REST (Express + TypeScript + Prisma)
├── prisma/               schema, migrations e seed
├── tests/                Jest (unitários) e Supertest (integração)
├── web/                  front-end React + Vite  ← entrega desta fase
├── docs/                 arquitetura, relato e este documento
├── Dockerfile            imagem da API (multi-stage)
├── web/Dockerfile        imagem do front (build Vite + nginx)
├── docker-compose.yml    banco + API + front
└── .github/workflows/    CI/CD no GitHub Actions
```

**Dockerfiles**: dois, um por aplicação. O da API compila o TypeScript num
estágio e leva só o `dist` e as dependências de produção no estágio final; o do
front roda o build do Vite e serve os arquivos estáticos com nginx, com fallback
para `index.html` (necessário para as rotas do React Router).

**CI/CD**: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), com três
jobs a cada push e pull request na `main`:

| Job | O que faz |
| --- | --------- |
| `test` | API: instala, gera o Prisma Client, ESLint, migrations num PostgreSQL de serviço, testes com cobertura e build |
| `web` | Front: instala, ESLint e build (typecheck + Vite), publicando o `dist/` como artefato |
| `docker` | Depois dos dois, builda as imagens Docker da API e do front |

## 2. Apresentação gravada

Demonstração em vídeo do funcionamento da aplicação, com os detalhes técnicos de
implementação. 

## 3. Documentação

| Documento | Conteúdo |
| --------- | -------- |
| [`README.md`](../README.md) | Visão geral, stack, como rodar, endpoints, autenticação, testes e CI/CD |
| [`web/README.md`](../web/README.md) | Documentação técnica do front: setup, arquitetura, rotas, autenticação, estilização, acessibilidade e guia de uso |
| [`docs/ARQUITETURA.md`](ARQUITETURA.md) | Arquitetura do sistema: camadas, modelo de dados, fluxo de erros, autenticação e containerização |
| [`docs/RELATO.md`](RELATO.md) | Relato de experiências e desafios enfrentados |
| Swagger em `/docs` | Documentação interativa da API (OpenAPI 3) |

---

## Requisitos do enunciado

### Funcionais

| # | Requisito | Onde está | Rota |
| - | --------- | --------- | ---- |
| 1 | Lista de posts com título, autor e descrição breve | [`HomePage`](../web/src/pages/HomePage.tsx), [`PostCard`](../web/src/components/PostCard.tsx) | `/` |
| 1 | Campo de busca por palavra-chave | [`SearchField`](../web/src/components/SearchField.tsx) + `GET /posts/search` | `/` |
| 2 | Leitura do post completo | [`PostPage`](../web/src/pages/PostPage.tsx) | `/posts/:id` |
| 3 | Criação de postagens (título, conteúdo, autor) | [`NewPostPage`](../web/src/pages/NewPostPage.tsx), [`PostForm`](../web/src/components/PostForm.tsx) | `/posts/novo` |
| 4 | Edição, carregando os dados atuais | [`EditPostPage`](../web/src/pages/EditPostPage.tsx) | `/posts/:id/editar` |
| 5 | Página administrativa com editar e excluir | [`AdminPage`](../web/src/pages/AdminPage.tsx) | `/admin` |
| 6 | Login de professores | [`LoginPage`](../web/src/pages/LoginPage.tsx) + `POST /auth/login` (JWT) | `/login` |
| 6 | Só autenticados acessam criação, edição e administração | [`ProtectedRoute`](../web/src/components/ProtectedRoute.tsx) no front e [`requireAuth`](../src/middlewares/auth.middleware.ts) na API | — |

O requisito 2 menciona comentários como opcional; não foram implementados.

### Técnicos

| Requisito | Como foi atendido |
| --------- | ----------------- |
| React com hooks e componentes funcionais | Toda a aplicação; não há componente de classe. Hooks próprios: `useAuth`, `useAsyncResource`, `useDebouncedValue` |
| Estilização | **styled-components** com tema central em [`theme.ts`](../web/src/styles/theme.ts), sem CSS solto |
| Responsividade | Layout mobile first; media queries por breakpoint do tema. Menu vira botão no celular, listas empilham, alvos de toque de 44px |
| Integração com o back-end | Camada de services ([`http.ts`](../web/src/services/http.ts)) cobrindo `GET /posts`, `/posts/search`, `/posts/:id`, `POST`, `PUT`, `DELETE` e as rotas de `/auth` |
| Gerenciamento de estado (opcional) | **Context API** em [`AuthProvider`](../web/src/contexts/AuthProvider.tsx) |
| Documentação no README | `README.md` na raiz e `web/README.md` com setup, arquitetura e guia de uso |

### Além do enunciado

- **Autenticação no back-end**: a fase anterior não tinha nenhuma. Foram criados
  o model `User`, login com bcrypt + JWT e o middleware que fecha as rotas de
  escrita — sem isso o requisito 6 seria apenas cosmético.
- **Cadastro de docentes** (`/cadastro`) com código de convite opcional,
  gerado em `/convites` por quem já tem acesso.
- **Acessibilidade**: HTML semântico, foco visível, rótulo em todo campo,
  `aria-invalid`/`aria-describedby` nos erros, `role="alert"` nas mensagens,
  diálogo de exclusão com foco e `Esc`, e respeito a `prefers-reduced-motion`.

---

## Como avaliar

### Opção A — tudo em containers (recomendada)

```bash
git clone https://github.com/DevTeixeira25/tech-challenge-blog.git
cd tech-challenge-blog
docker compose up --build -d
docker compose exec app node dist/seed.js
```

| Serviço | Endereço |
| ------- | -------- |
| Front-end | http://localhost:8080 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/docs |

### Opção B — desenvolvimento

```bash
docker compose up -d db          # só o banco
npm install && cp .env.example .env
npm run prisma:deploy && npm run seed
npm run dev                      # API em :3000

cd web
npm install && cp .env.example .env
npm run dev                      # front em :5173
```

### Credenciais de demonstração

O seed cria dois docentes, ambos com a senha `senha123`:

- `ana@blog.dev`
- `carlos@blog.dev`

Também é possível criar uma conta nova em `/cadastro`.

### Roteiro sugerido de avaliação

1. Abra a home **sem estar logado**: veja a lista e busque por `fotossíntese`.
2. Abra um post pela lista.
3. Tente acessar `/admin` direto pela URL — você é levado ao login.
4. Entre com `ana@blog.dev` / `senha123`.
5. Crie um post em **Novo post** (o campo autor(a) já vem preenchido).
6. Edite o post pela própria página de leitura.
7. Exclua o post em **Administração** (há confirmação).
8. Reduza a janela para largura de celular e repita a navegação.
9. Confirme que a API recusa escrita sem token: no Swagger, `POST /posts` sem
   autorizar devolve **401**.

---

## Verificação automatizada

```bash
npm run lint         # ESLint da API
npm run test:cov     # 57 testes (unitários + integração) com cobertura
npm run build        # compila a API

cd web
npm run lint         # ESLint do front
npm run build        # typecheck + bundle de produção
```

Cobertura global em torno de **95%**, com os services de posts e de autenticação
em 100%. O mínimo exigido no desafio (20%) está configurado como
`coverageThreshold` no [`jest.config.js`](../jest.config.js), então a suíte falha
se a cobertura cair abaixo disso.

> Os testes de integração apagam as tabelas de `posts` e `users` ao final. Rode
> `npm run seed` depois deles para repovoar o banco de demonstração.
