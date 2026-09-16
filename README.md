# Blog dos Docentes — Tech Challenge FIAP

Plataforma de blogging para professores(as) da rede pública: docentes publicam
aulas e materiais, estudantes leem e buscam os posts. O repositório reúne as
duas partes da aplicação:

- **API REST** (Node.js + TypeScript + PostgreSQL), na raiz;
- **Front-end** (React + TypeScript + styled-components), em [`web/`](web).

![CI](https://img.shields.io/badge/CI-GitHub_Actions-blue)
![Node](https://img.shields.io/badge/Node.js-20-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![React](https://img.shields.io/badge/React-19-61dafb)

## Sumário

- [Demonstração](#demonstração)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Rodando com Docker](#rodando-com-docker)
- [Rodando localmente](#rodando-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Endpoints](#endpoints)
- [Autenticação](#autenticação)
- [Swagger](#swagger)
- [Testes](#testes)
- [CI/CD](#cicd)
- [Relato de experiências e desafios](#relato-de-experiências-e-desafios)
- [Entrega](#entrega)

## Estrutura do repositório

```
.
├── src/            API REST (Express, Prisma, Zod)
├── prisma/         schema, migrations e seed
├── tests/          testes unitários (Jest) e e2e (Supertest)
├── web/            front-end React (Vite) — README próprio em web/README.md
├── docs/           entrega, arquitetura e relato de experiências
└── docker-compose.yml   banco + API + front-end
```

A documentação técnica detalhada do front-end (setup, arquitetura e guia de uso)
está em [`web/README.md`](web/README.md).

## Demonstração

Vídeo de apresentação: _(link a adicionar após a gravação)_

O documento de entrega, com o mapeamento de cada requisito do enunciado e um
roteiro de avaliação, está em [`docs/ENTREGA.md`](docs/ENTREGA.md).

## Stack

**Back-end**

- Node.js 20 com TypeScript
- Express para roteamento e middlewares
- PostgreSQL 16 como banco de dados
- Prisma como ORM
- Zod para validação de entrada
- JWT (`jsonwebtoken`) e bcrypt no login dos docentes
- Jest e Supertest nos testes
- Swagger UI (OpenAPI 3) para a documentação da API

**Front-end**

- React 19 com hooks e componentes funcionais
- Vite como bundler e dev server
- React Router para as rotas da SPA
- styled-components com tema central
- Context API para o estado de autenticação

**Infra**

- Docker e Docker Compose
- Nginx servindo o bundle do front-end
- GitHub Actions para CI/CD

## Arquitetura

A aplicação é dividida em camadas (rota, controller, service e repository) para
manter cada responsabilidade separada e deixar a regra de negócio fácil de
testar.

```
React (SPA)  ──HTTP/JSON──►  routes → controller → service → repository → Prisma → PostgreSQL
  web/                        (auth)    (HTTP)      (regra)    (dados)
```

- **routes**: definem os caminhos e chamam o controller. As de escrita passam antes pelo middleware de autenticação.
- **controllers**: fazem a ponte entre HTTP e o service, e validam a entrada com Zod.
- **services**: onde fica a regra de negócio (por exemplo, devolver 404 quando o post não existe). Recebem o repositório por injeção, o que permite testá-los com um mock.
- **repositories**: a única camada que conversa diretamente com o Prisma.
- **middlewares**: autenticação JWT, rota 404 e tratamento central de erros.

No front-end a divisão segue a mesma ideia: as páginas não chamam `fetch`
direto, tudo passa por uma camada de `services`. O detalhamento está em
[`web/README.md`](web/README.md).

Os detalhes de cada arquivo estão em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## Pré-requisitos

Você precisa de uma das duas opções:

- Docker com Docker Compose, ou
- Node.js 20+ e um PostgreSQL acessível.

## Rodando com Docker

O jeito mais simples. Sobe banco, API e front-end de uma vez:

```bash
docker compose up --build
```

| Serviço    | Endereço                     |
| ---------- | ---------------------------- |
| Front-end  | http://localhost:8080        |
| API        | http://localhost:3000        |
| Swagger    | http://localhost:3000/docs   |
| PostgreSQL | `localhost:5433`             |

As migrations do Prisma são aplicadas automaticamente quando o container da API
inicia (ver `docker-entrypoint.sh`).

Para popular com posts de exemplo e criar os docentes de teste:

```bash
docker compose exec app node dist/seed.js
```

O seed cria **ana@blog.dev** e **carlos@blog.dev**, ambos com a senha
**senha123** — é com eles que dá para entrar na área administrativa.

Para parar:

```bash
docker compose down
```

## Rodando localmente

Se preferir rodar direto no host (útil no desenvolvimento):

```bash
# 1. dependências da API
npm install

# 2. sobe só o banco pelo Docker
docker compose up -d db

# 3. cria o .env
cp .env.example .env

# 4. aplica as migrations e popula
npm run prisma:deploy
npm run seed

# 5. sobe a API com hot-reload (http://localhost:3000)
npm run dev
```

Em outro terminal, o front-end:

```bash
cd web
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

## Variáveis de ambiente

API (`.env` na raiz):

| Variável         | Descrição                                  | Exemplo                                                      |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------ |
| `PORT`           | Porta da API                               | `3000`                                                       |
| `DATABASE_URL`   | Conexão do PostgreSQL                      | `postgresql://blog:blog@localhost:5433/blog?schema=public`   |
| `JWT_SECRET`     | Chave que assina os tokens (mín. 16 chars) | `dev-secret-troque-em-producao`                              |
| `JWT_EXPIRES_IN` | Validade do token                          | `1d`                                                         |

Front-end (`web/.env`):

| Variável       | Descrição             | Exemplo                 |
| -------------- | --------------------- | ----------------------- |
| `VITE_API_URL` | URL base da API REST  | `http://localhost:3000` |

O `JWT_SECRET` tem um valor padrão para não travar o desenvolvimento e o CI, mas
a aplicação **se recusa a subir em produção** sem a variável definida.

Uma observação sobre a porta: dentro do Docker o Postgres usa a 5432 na rede
interna (`db:5432`). No host, o compose expõe o banco na **5433**, para não
brigar com um PostgreSQL que já esteja instalado na máquina. Por isso, ao rodar
app ou testes localmente, o `DATABASE_URL` aponta para `localhost:5433`.

## Endpoints

Base: `http://localhost:3000`

| Método   | Rota             | Acesso   | Descrição                                     |
| -------- | ---------------- | -------- | --------------------------------------------- |
| `POST`   | `/auth/login`    | Público  | Autentica o(a) docente e devolve o token JWT  |
| `POST`   | `/auth/register` | Público  | Cadastra um(a) docente (convite opcional)     |
| `GET`    | `/auth/me`       | Token    | Dados do(a) docente autenticado(a)            |
| `POST`   | `/auth/invites`  | Token    | Gera um convite para um(a) novo(a) docente    |
| `GET`    | `/auth/invites`  | Token    | Lista os convites gerados                     |
| `GET`    | `/posts`         | Público  | Lista todos os posts                          |
| `GET`    | `/posts/search`  | Público  | Busca posts por palavra-chave (`?q=termo`)    |
| `GET`    | `/posts/:id`     | Público  | Lê um post específico                         |
| `POST`   | `/posts`         | Token    | Cria uma postagem                             |
| `PUT`    | `/posts/:id`     | Token    | Edita uma postagem                            |
| `DELETE` | `/posts/:id`     | Token    | Exclui uma postagem                           |
| `GET`    | `/health`        | Público  | Healthcheck                                   |

### Exemplos com curl

Entrar e guardar o token:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "ana@blog.dev", "password": "senha123" }' | jq -r .token)
```

Criar um post (precisa do token):

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Introdução à fotossíntese",
    "content": "A fotossíntese converte luz solar em energia.",
    "author": "Prof. Carlos Lima"
  }'
```

Listar todos:

```bash
curl http://localhost:3000/posts
```

Buscar por palavra-chave:

```bash
curl "http://localhost:3000/posts/search?q=fotossíntese"
```

Ler, editar e excluir (troque `<ID>` pelo id retornado na criação):

```bash
curl http://localhost:3000/posts/<ID>

curl -X PUT http://localhost:3000/posts/<ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "title": "Novo título" }'

curl -X DELETE http://localhost:3000/posts/<ID> \
  -H "Authorization: Bearer $TOKEN"
```

### Respostas de erro

Os erros seguem um formato único, montado no middleware central:

```json
{
  "error": "ValidationError",
  "message": "Dados inválidos",
  "details": { "title": ["title não pode ser vazio"] }
}
```

| Status | Quando                                            |
| ------ | ------------------------------------------------- |
| `400`  | Corpo ou query inválidos (validação Zod)          |
| `401`  | Credenciais inválidas, ou token ausente/expirado  |
| `409`  | E-mail já cadastrado                              |
| `404`  | Post ou rota não encontrados                      |
| `500`  | Erro interno inesperado                           |

## Autenticação

A leitura do blog é aberta. Criar, editar e excluir exige um(a) docente
autenticado(a):

1. `POST /auth/login` recebe e-mail e senha e devolve um **JWT** junto com os
   dados públicos do usuário (o hash da senha nunca sai da API).
2. As rotas de escrita passam pelo middleware `requireAuth`, que exige o header
   `Authorization: Bearer <token>` e recusa com **401** quando ele falta, está
   inválido ou expirou.
3. `GET /auth/me` devolve o perfil de quem está com o token — é o que o
   front-end usa para revalidar a sessão a cada carregamento.

As senhas são guardadas como hash **bcrypt** (custo 10) na tabela `users`. Como o
login devolve a mesma resposta para e-mail inexistente e senha errada, a API não
entrega quais e-mails existem.

### Como um(a) docente ganha acesso

> **Extra além do enunciado.** O Tech Challenge pede login de professores e
> proteção das páginas de criação, edição e administração — as duas coisas estão
> cumpridas pelo JWT e pelo `requireAuth`. O que vem abaixo responde uma pergunta
> que o enunciado deixa em aberto: como entra quem ainda não tem conta.

**Cadastro aberto.** Em `/cadastro` (ou `POST /auth/register`) a pessoa informa
nome, e-mail e senha e já entra logada — o endpoint devolve o token junto com os
dados do usuário, sem precisar passar pelo login em seguida.

**Convite (opcional).** Quem já tem acesso pode gerar um código na página
**Convites** e mandar o link pronto para um(a) colega:

```
docente autenticado ──POST /auth/invites──► código KQ3P-FZQP-KYBU (vale 1 vez, expira)
                                                    │
                                     link /cadastro?convite=<código>
                                                    ▼
pessoa convidada ──POST /auth/register (nome, e-mail, senha, código)──► conta criada + token
```

- O convite vale **uma única vez** e tem validade (7 dias por padrão, até 90).
- Informando um e-mail na criação, o convite fica **nominal**: só aquele e-mail
  consegue usá-lo.
- O código usa um alfabeto sem caracteres ambíguos (sem `0/O`, `1/I/L`), para
  poder ser ditado por telefone.
- Um código informado e inválido (inexistente, usado, expirado ou emitido para
  outro e-mail) recusa o cadastro com **400**; sem código, o cadastro segue
  normalmente.

Como o cadastro é aberto, o convite não funciona como barreira de acesso: ele
serve para indicar alguém nominalmente e registrar quem entrou por indicação.
Para fechar o cadastro e voltar a exigir convite, basta tornar o `code`
obrigatório no `registerSchema` e no `register` do `auth.service.ts`.

## Swagger

Com a API no ar, a documentação interativa fica em
http://localhost:3000/docs. Dá para explorar e testar todos os endpoints por ali,
sem precisar de Postman ou curl.

## Testes

Os testes usam Jest para os unitários e Supertest para os de integração. O
mínimo de 20% de cobertura exigido no desafio está garantido pelo
`coverageThreshold` no [`jest.config.js`](jest.config.js). Na prática a
cobertura fica bem acima disso.

```bash
# só os unitários (não precisam de banco)
npm run test:unit

# tudo, incluindo os e2e (precisa do banco no ar)
npm test

# com relatório de cobertura
npm run test:cov
```

Os testes e2e precisam de um PostgreSQL com as migrations aplicadas. Antes de
rodá-los, suba o banco com `docker compose up -d db` e rode `npm run prisma:deploy`.

- Os unitários (`tests/posts.service.test.ts` e `tests/auth.service.test.ts`)
  exercitam os services com repositórios mockados, cobrindo as funções críticas
  (criação, edição, exclusão, busca, login e as regras de convite) sem encostar
  no banco.
- Os de integração (`tests/posts.e2e.test.ts` e `tests/auth.e2e.test.ts`) sobem a
  app Express e batem em cada endpoint contra um banco real, incluindo os casos
  de 401 nas rotas protegidas.

No front-end, a checagem automática é o `npm run lint` e o `npm run build` (que
roda o `tsc` antes do bundle) — ambos entram no CI.

## CI/CD

O workflow em [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda a cada
push e pull request na branch `main`, em três jobs:

| Job      | O que faz                                                                                     |
| -------- | --------------------------------------------------------------------------------------------- |
| `test`   | API: instala, gera o Prisma Client, ESLint, aplica migrations num PostgreSQL de serviço, testes com cobertura e build |
| `web`    | Front-end: instala, ESLint e build (typecheck + Vite), publicando o `dist/` como artefato      |
| `docker` | Depois dos dois anteriores, builda as imagens Docker da API e do front-end                     |

## Relato de experiências e desafios

Está em [`docs/RELATO.md`](docs/RELATO.md).

## Entrega

| Item | Onde |
| ---- | ---- |
| Código-fonte, Dockerfiles e CI/CD | este repositório |
| Apresentação gravada | link na seção [Demonstração](#demonstração) |
| Documentação | [`docs/ENTREGA.md`](docs/ENTREGA.md), [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md), [`docs/RELATO.md`](docs/RELATO.md) e [`web/README.md`](web/README.md) |
