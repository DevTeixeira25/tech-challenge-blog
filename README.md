# API de Blogging — Tech Challenge FIAP

API REST para uma plataforma de blogging voltada a professores da rede pública.
Permite criar, ler, listar, buscar, editar e excluir postagens. É a versão do
back-end refatorada de OutSystems para Node.js, agora com os dados persistidos
em PostgreSQL.

![CI](https://img.shields.io/badge/CI-GitHub_Actions-blue)
![Node](https://img.shields.io/badge/Node.js-20-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Sumário

- [Demonstração](#demonstração)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Rodando com Docker](#rodando-com-docker)
- [Rodando localmente](#rodando-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Endpoints](#endpoints)
- [Swagger](#swagger)
- [Testes](#testes)
- [CI/CD](#cicd)
- [Relato de experiências e desafios](#relato-de-experiências-e-desafios)

## Demonstração

Vídeo de apresentação: _(link a adicionar após a gravação)_

## Stack

- Node.js 20 com TypeScript
- Express para roteamento e middlewares
- PostgreSQL 16 como banco de dados
- Prisma como ORM
- Zod para validação de entrada
- Jest e Supertest nos testes
- Docker e Docker Compose
- GitHub Actions para CI/CD
- Swagger UI (OpenAPI 3) para a documentação da API

## Arquitetura

A aplicação é dividida em camadas (rota, controller, service e repository) para
manter cada responsabilidade separada e deixar a regra de negócio fácil de
testar.

```
routes → controller → service → repository → Prisma → PostgreSQL
           (HTTP)      (regra)    (dados)
```

- **routes**: definem os caminhos e chamam o controller.
- **controllers**: fazem a ponte entre HTTP e o service, e validam a entrada com Zod.
- **services**: onde fica a regra de negócio (por exemplo, devolver 404 quando o post não existe). Recebem o repositório por injeção, o que permite testá-los com um mock.
- **repositories**: a única camada que conversa diretamente com o Prisma.
- **middlewares**: healthcheck, rota 404 e tratamento central de erros.

Os detalhes de cada arquivo estão em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## Pré-requisitos

Você precisa de uma das duas opções:

- Docker com Docker Compose, ou
- Node.js 20+ e um PostgreSQL acessível.

## Rodando com Docker

O jeito mais simples. Sobe a API e o banco de uma vez:

```bash
docker compose up --build
```

A API fica em http://localhost:3000. As migrations do Prisma são aplicadas
automaticamente quando o container inicia (ver `docker-entrypoint.sh`).

Para popular com alguns posts de exemplo:

```bash
docker compose exec app npx prisma db seed
```

Para parar:

```bash
docker compose down
```

## Rodando localmente

Se preferir rodar a API direto no host (útil no desenvolvimento):

```bash
# 1. dependências
npm install

# 2. sobe só o banco pelo Docker
docker compose up -d db

# 3. cria o .env
cp .env.example .env

# 4. aplica as migrations e popula
npm run prisma:deploy
npm run seed

# 5. sobe a API com hot-reload
npm run dev
```

## Variáveis de ambiente

| Variável       | Descrição                       | Exemplo                                                      |
| -------------- | ------------------------------- | ------------------------------------------------------------ |
| `PORT`         | Porta da API                    | `3000`                                                       |
| `DATABASE_URL` | Conexão do PostgreSQL           | `postgresql://blog:blog@localhost:5433/blog?schema=public`   |

Uma observação sobre a porta: dentro do Docker o Postgres usa a 5432 na rede
interna (`db:5432`). No host, o compose expõe o banco na **5433**, para não
brigar com um PostgreSQL que já esteja instalado na máquina. Por isso, ao rodar
app ou testes localmente, o `DATABASE_URL` aponta para `localhost:5433`.

## Endpoints

Base: `http://localhost:3000`

| Método   | Rota             | Descrição                                     |
| -------- | ---------------- | --------------------------------------------- |
| `GET`    | `/posts`         | Lista todos os posts                          |
| `GET`    | `/posts/search`  | Busca posts por palavra-chave (`?q=termo`)    |
| `GET`    | `/posts/:id`     | Lê um post específico                         |
| `POST`   | `/posts`         | Cria uma postagem                             |
| `PUT`    | `/posts/:id`     | Edita uma postagem                            |
| `DELETE` | `/posts/:id`     | Exclui uma postagem                           |
| `GET`    | `/health`        | Healthcheck                                   |

### Exemplos com curl

Criar um post:

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
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
  -d '{ "title": "Novo título" }'

curl -X DELETE http://localhost:3000/posts/<ID>
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

| Status | Quando                                       |
| ------ | -------------------------------------------- |
| `400`  | Corpo ou query inválidos (validação Zod)     |
| `404`  | Post ou rota não encontrados                 |
| `500`  | Erro interno inesperado                      |

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

- Os unitários (`tests/posts.service.test.ts`) exercitam o `PostsService` com um
  repositório mockado, cobrindo as funções críticas (criação, edição, exclusão
  e busca) sem encostar no banco.
- Os de integração (`tests/posts.e2e.test.ts`) sobem a app Express e batem em
  cada endpoint contra um banco real.

## CI/CD

O workflow em [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda a cada
push e pull request na branch `main` e faz, em ordem: instala as dependências,
gera o Prisma Client, roda o ESLint, aplica as migrations num PostgreSQL de
serviço, executa os testes com cobertura, compila o TypeScript e por fim builda
a imagem Docker para validar o Dockerfile.

## Relato de experiências e desafios

Está em [`docs/RELATO.md`](docs/RELATO.md).
