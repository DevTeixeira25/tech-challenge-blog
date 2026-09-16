# Front-end — Blog dos Docentes

Interface web do blog, escrita em React com TypeScript. Consome a API REST que
está na raiz deste repositório: lista e leitura são abertas a estudantes, e
criar, editar e excluir exigem login de docente.

## Sumário

- [Stack](#stack)
- [Setup inicial](#setup-inicial)
- [Scripts](#scripts)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Arquitetura](#arquitetura)
- [Rotas e páginas](#rotas-e-páginas)
- [Autenticação](#autenticação)
- [Comunicação com a API](#comunicação-com-a-api)
- [Estilização e responsividade](#estilização-e-responsividade)
- [Acessibilidade](#acessibilidade)
- [Guia de uso](#guia-de-uso)
- [Build e Docker](#build-e-docker)

## Stack

- **React 19** com hooks e componentes funcionais (não há um único componente de classe)
- **TypeScript** em modo estrito
- **Vite** como bundler e dev server
- **React Router** para as rotas da SPA
- **styled-components** para a estilização, com tema central
- **Context API** para o estado de autenticação
- **ESLint** (flat config) com as regras de hooks do React

## Setup inicial

Pré-requisitos: Node.js 20+ e a API rodando (veja o README da raiz).

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

A aplicação sobe em http://localhost:5173 e espera a API em
http://localhost:3000 (ajustável pelo `.env`).

Para ter posts e um docente de teste no banco, rode o seed da API
(`npm run seed` na raiz). Ele cria o usuário **ana@blog.dev** com a senha
**senha123**. Novos docentes entram por convite, gerado na página
**Convites** por quem já tem acesso.

## Scripts

| Script            | O que faz                                            |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Dev server com hot reload (porta 5173)               |
| `npm run build`   | Checa os tipos (`tsc --noEmit`) e gera o bundle       |
| `npm run preview` | Serve o build de produção localmente (porta 4173)     |
| `npm run lint`    | ESLint em todo o projeto                              |

## Variáveis de ambiente

| Variável       | Descrição                  | Padrão                  |
| -------------- | -------------------------- | ----------------------- |
| `VITE_API_URL` | URL base da API REST       | `http://localhost:3000` |

Por ser uma SPA estática, o valor entra no bundle em **tempo de build**. No
Docker isso é feito pelo build arg de mesmo nome.

## Arquitetura

```
┌──────────────────────────────────────────────────────────┐
│ App.tsx                                                   │
│  ThemeProvider ─ GlobalStyle ─ BrowserRouter ─ AuthProvider│
└───────────────────────────┬──────────────────────────────┘
                            ▼
                  Layout (cabeçalho + rodapé)
                            │
        ┌───────────────────┴────────────────────┐
        ▼                                        ▼
  rotas públicas                         ProtectedRoute
  /  /posts/:id                      /posts/novo  /posts/:id/editar
  /login  /cadastro                  /admin  /convites
        │                                        │
        └──────────────► services ◄──────────────┘
                     (posts, auth, http)
                            │
                            ▼
                        API REST
```

Organização das pastas em `src/`:

| Pasta         | Conteúdo                                                              |
| ------------- | --------------------------------------------------------------------- |
| `pages/`      | Uma página por rota (Home, Post, Login, Register, New, Edit, Admin, Invites, NotFound) |
| `components/` | Componentes reutilizáveis; `ui/` guarda os blocos de estilo genéricos  |
| `contexts/`   | Contexto de autenticação (Context API)                                 |
| `hooks/`      | `useAuth`, `useAsyncResource` e `useDebouncedValue`                    |
| `services/`   | Camada que fala com a API (`http`, `posts`, `auth`) e a sessão         |
| `styles/`     | Tema (cores, espaçamentos, breakpoints) e estilos globais              |
| `types/`      | Tipos compartilhados (`Post`, `User`, `Invite`...) espelhando os da API |
| `utils/`      | Funções puras de formatação (data e resumo do conteúdo)               |

A ideia é a mesma do back-end: nenhuma página chama `fetch` diretamente. Tudo
passa pela camada de `services`, o que mantém a URL da API, o envio do token e o
tratamento de erro num lugar só.

### Estado das telas: `useAsyncResource`

Buscar dados da API se repete em cinco páginas, sempre com os mesmos três
estados (carregando, erro, dados). Em vez de duplicar isso, criei o hook
[`useAsyncResource`](src/hooks/useAsyncResource.ts).

Ele tem um detalhe importante: o `loading` é **derivado**, comparando a chave
dos dados guardados com a chave atual, em vez de virar um `setState` dentro do
`useEffect`. Essa é a forma recomendada hoje pelo React (e exigida pela regra
`react-hooks/set-state-in-effect`), porque evita renders em cascata. Cada busca
também recebe um `AbortSignal`, então trocar de página ou digitar outra
palavra-chave cancela a requisição anterior em vez de deixar uma resposta antiga
sobrescrever a nova.

## Rotas e páginas

| Rota                | Página          | Acesso       | O que faz                                               |
| ------------------- | --------------- | ------------ | ------------------------------------------------------- |
| `/`                 | `HomePage`      | Público      | Lista os posts (título, autor, data e prévia) e busca    |
| `/posts/:id`        | `PostPage`      | Público      | Leitura do post completo                                 |
| `/login`            | `LoginPage`     | Público      | Login do(a) docente                                      |
| `/cadastro`         | `RegisterPage`  | Público      | Cadastro de docente; convite opcional (`?convite=`)      |
| `/posts/novo`       | `NewPostPage`   | Autenticado  | Criação de postagem                                      |
| `/posts/:id/editar` | `EditPostPage`  | Autenticado  | Edição, já com os dados atuais carregados                |
| `/admin`            | `AdminPage`     | Autenticado  | Lista todos os posts com editar e excluir                |
| `/convites`         | `InvitesPage`   | Autenticado  | Gera e acompanha os convites de novos docentes           |
| qualquer outra      | `NotFoundPage`  | Público      | 404 do cliente                                           |

A busca da home usa `GET /posts/search?q=` com _debounce_ de 400 ms: a chamada
só sai depois que a pessoa para de digitar.

## Autenticação

O fluxo é todo baseado no JWT que a API devolve em `POST /auth/login`:

1. A pessoa entra em `/login` e envia e-mail e senha.
2. O token e os dados do usuário vão para o `localStorage`
   ([`services/session.ts`](src/services/session.ts)).
3. O [`AuthProvider`](src/contexts/AuthProvider.tsx) guarda o usuário em memória
   e expõe `user`, `isAuthenticated`, `login`, `register` e `logout` pelo
   Context API.
4. A cada carregamento da página o token guardado é **revalidado** em
   `GET /auth/me`. Se estiver expirado ou inválido, a sessão é limpa — isso
   evita a interface achar que a pessoa está logada quando não está mais.
5. O [`ProtectedRoute`](src/components/ProtectedRoute.tsx) barra as rotas
   restritas e manda para `/login` guardando o destino original, para devolver a
   pessoa ao lugar certo depois de entrar.
6. Se alguma chamada autenticada responder 401 no meio do uso, o wrapper de HTTP
   avisa o contexto e o logout acontece sozinho.

A proteção real está na API: o front-end apenas esconde o que a pessoa não pode
usar, mas quem recusa a escrita sem token é o back-end.

### E quem ainda não tem conta?

> Funcionalidade extra: o enunciado pede apenas o login e a proteção das rotas,
> que já estão resolvidos acima.

Cria a conta em `/cadastro`: nome, e-mail e senha. O `POST /auth/register` já
devolve o token, então a pessoa entra direto, sem passar pelo login.

O campo **código do convite**, no fim do formulário, é opcional. Em `/convites`
um(a) docente autenticado(a) gera um código (`XXXX-XXXX-XXXX`) e o link pronto
`/cadastro?convite=<código>` — a página de cadastro lê o código da query string
e já deixa o campo preenchido. O convite vale uma vez só, expira (7 dias por
padrão) e pode ser nominal, preso a um e-mail; a lista em `/convites` mostra a
situação de cada um (ativo, usado ou expirado).

## Comunicação com a API

[`services/http.ts`](src/services/http.ts) concentra o `fetch`:

- monta a URL a partir de `VITE_API_URL`;
- injeta `Authorization: Bearer <token>` quando a chamada é autenticada;
- trata o `204 No Content` do DELETE;
- transforma erro em `ApiError` com `status` e a mensagem vinda da API, e
  devolve uma mensagem amigável quando o servidor está fora do ar.

| Ação na interface       | Chamada                       |
| ----------------------- | ----------------------------- |
| Listar posts            | `GET /posts`                  |
| Buscar por palavra      | `GET /posts/search?q=`        |
| Ler um post             | `GET /posts/:id`              |
| Publicar                | `POST /posts` (token)         |
| Salvar edição           | `PUT /posts/:id` (token)      |
| Excluir                 | `DELETE /posts/:id` (token)   |
| Entrar                  | `POST /auth/login`            |
| Criar conta             | `POST /auth/register`         |
| Gerar convite           | `POST /auth/invites` (token)  |
| Listar convites         | `GET /auth/invites` (token)   |
| Revalidar a sessão      | `GET /auth/me` (token)        |

## Estilização e responsividade

Toda a estilização é feita com **styled-components**, sem CSS solto pelo
projeto. As cores, espaçamentos, raios, sombras e breakpoints ficam em
[`styles/theme.ts`](src/styles/theme.ts) e chegam aos componentes pelo
`ThemeProvider`.

O layout é _mobile first_: os estilos base valem para telas pequenas e as media
queries (`min-width`) ampliam a partir de 768px. Na prática:

- o menu vira um botão "Menu" no celular e uma barra horizontal no desktop;
- a lista da administração empilha as ações no celular e alinha em linha no desktop;
- botões têm altura mínima de 44px, um alvo de toque confortável;
- os campos usam fonte de 16px, o que evita o zoom automático do iOS ao focar.

## Acessibilidade

- HTML semântico (`header`, `main`, `article`, `time`, listas) e um `h1` por página.
- Link "pular para o conteúdo" e foco sempre visível (`:focus-visible`).
- Todo campo tem `<label>` ligado por `htmlFor`; erros usam `aria-invalid` e
  `aria-describedby`.
- Mensagens de erro e sucesso são anunciadas com `role="alert"`; a contagem de
  resultados da busca, com `aria-live`.
- O diálogo de exclusão usa `role="dialog"`, `aria-modal`, abre com o foco no
  botão seguro (Cancelar) e fecha com `Esc`.
- Botões repetidos na lista ("Editar", "Excluir") recebem o título do post em
  texto só para leitores de tela.
- `prefers-reduced-motion` desliga as animações.

## Guia de uso

**Para estudantes (sem login)**

1. Abra a home: os posts aparecem do mais recente para o mais antigo.
2. Digite no campo de busca para filtrar por palavra no título ou no conteúdo.
3. Clique em "Ler post completo" para abrir o texto inteiro.

**Para docentes**

1. Clique em **Entrar** e informe e-mail e senha (no ambiente de
   desenvolvimento, `ana@blog.dev` / `senha123`).
2. Depois do login aparecem **Administração**, **Novo post** e **Convites** no menu.
3. Em **Novo post**, preencha título e conteúdo. O campo autor(a) já vem com a
   assinatura sugerida a partir do seu nome — título, primeiro nome e sobrenome
   ("Jefferson de Oliveira da Costa Teixeira" vira "Prof. Jefferson Teixeira") —
   e pode ser editada. Clique em **Publicar post** e você cai direto na página
   do post criado.
4. Em **Administração** estão todos os posts, com **Editar** e **Excluir**. A
   exclusão pede confirmação antes de apagar.
5. **Sair** encerra a sessão e limpa o token guardado.

**Para criar a própria conta**

1. Na tela de login, clique em **Criar conta** (ou vá direto em `/cadastro`).
2. Preencha nome, e-mail e senha. O código de convite, no fim do formulário, só
   é necessário se alguém enviou um para você.
3. Clique em **Criar conta e entrar** — você já entra logado(a).

**Para convidar um(a) colega**

1. Em **Convites**, opcionalmente informe o e-mail da pessoa e a validade em dias.
2. Clique em **Gerar convite**: aparece o código e o link de cadastro, com um
   botão para copiar.
3. Envie o link. O formulário abre com o código já preenchido.
4. Depois do cadastro, o convite consta como **usado** e não serve de novo.

## Build e Docker

```bash
npm run build     # gera dist/
npm run preview   # confere o build localmente
```

A imagem serve o `dist/` com nginx, incluindo o fallback para `index.html` que
as rotas do React Router precisam:

```bash
docker build -t blog-web --build-arg VITE_API_URL=http://localhost:3000 .
docker run -p 8080:80 blog-web
```

Pelo `docker-compose.yml` da raiz, o front-end sobe junto com API e banco em
http://localhost:8080.
