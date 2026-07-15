# 📝 API de Blogging — Tech Challenge FIAP

API REST para uma plataforma de blogging dinâmico voltada a **docentes da rede
pública de educação**, permitindo criar, editar, listar, buscar e excluir
postagens. Back-end refatorado da versão OutSystems para **Node.js**, com
persistência em **PostgreSQL**.

![CI](https://img.shields.io/badge/CI-GitHub_Actions-blue)
![Node](https://img.shields.io/badge/Node.js-20-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## 📚 Sumário

- [Demonstração](#-demonstração)
- [Stack](#-stack)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Setup rápido (Docker)](#-setup-rápido-docker)
- [Setup local (sem Docker)](#-setup-local-sem-docker)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Endpoints da API](#-endpoints-da-api)
- [Documentação interativa (Swagger)](#-documentação-interativa-swagger)
- [Testes](#-testes)
- [CI/CD](#-cicd)
- [Relato de experiências e desafios](#-relato-de-experiências-e-desafios)

---

## 🎥 Demonstração

📺 **Vídeo de apresentação:** _(adicionar link aqui — ex.: YouTube)_

> Substitua o texto acima pela URL do vídeo de demonstração após a gravação.

---

## 🧰 Stack

| Camada          | Tecnologia               |
| --------------- | ------------------------ |
| Runtime         | Node.js 20               |
| Linguagem       | TypeScript               |
| Framework HTTP  | Express                  |
| Banco de dados  | PostgreSQL 16            |
| ORM             | Prisma                   |
| Validação       | Zod                      |
| Testes          | Jest + Supertest         |
| Container       | Docker + Docker Compose  |
| CI/CD           | GitHub Actions           |
| Documentação    | Swagger UI (OpenAPI 3)   |

---

## 🏛 Arquitetura

O projeto segue uma arquitetura em camadas
(**Controller → Service → Repository**), separando responsabilidades e
tornando a regra de negócio testável de forma isolada.

```
Request
  │
  ▼
routes ──► controller ──► service ──► repository ──► Prisma ──► PostgreSQL
             (HTTP)       (regra)     (acesso a       (ORM)
              +Zod         de negócio)  dados)
```

- **routes**: definem os caminhos e delegam ao controller.
- **controllers**: traduzem HTTP ↔ service; validam entrada com Zod.
- **services**: regra de negócio (ex.: 404 quando o post não existe). Recebem
  o repositório por injeção → testáveis com mock.
- **repositories**: única camada que conhece o Prisma.
- **middlewares**: tratamento central de erros e rota 404.

Estrutura de pastas detalhada em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

---

## ✅ Pré-requisitos

- [Docker](https://www.docker.com/) + Docker Compose **ou**
- [Node.js 20+](https://nodejs.org/) e um PostgreSQL acessível

---

## 🚀 Setup rápido (Docker)

Sobe a API **e** o banco com um comando:

```bash
docker compose up --build
```

A API estará em **http://localhost:3000** e as migrations são aplicadas
automaticamente no start (via `docker-entrypoint.sh`).

Para popular com dados de exemplo:

```bash
docker compose exec app npx prisma db seed
```

Parar tudo:

```bash
docker compose down
```

---

## 💻 Setup local (sem Docker)

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Suba **apenas** o banco via Docker (mais simples):

   ```bash
   docker compose up -d db
   ```

3. Crie o arquivo `.env` a partir do exemplo:

   ```bash
   cp .env.example .env
   ```

4. Aplique as migrations e popule o banco:

   ```bash
   npm run prisma:deploy
   npm run seed
   ```

5. Rode em modo desenvolvimento (hot-reload):

   ```bash
   npm run dev
   ```

---

## 🔧 Variáveis de ambiente

| Variável       | Descrição                       | Exemplo                                                      |
| -------------- | ------------------------------- | ------------------------------------------------------------ |
| `PORT`         | Porta da API                    | `3000`                                                       |
| `DATABASE_URL` | String de conexão do PostgreSQL | `postgresql://blog:blog@localhost:5432/blog?schema=public`   |

---

## 🌐 Endpoints da API

Base URL: `http://localhost:3000`

| Método   | Rota             | Descrição                                     |
| -------- | ---------------- | --------------------------------------------- |
| `GET`    | `/posts`         | Lista todos os posts                          |
| `GET`    | `/posts/search`  | Busca posts por palavra-chave (`?q=termo`)    |
| `GET`    | `/posts/:id`     | Lê um post específico                         |
| `POST`   | `/posts`         | Cria uma nova postagem                        |
| `PUT`    | `/posts/:id`     | Edita uma postagem existente                  |
| `DELETE` | `/posts/:id`     | Exclui uma postagem                           |
| `GET`    | `/health`        | Healthcheck                                   |

### Exemplos com `curl`

**Criar um post**

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introdução à fotossíntese",
    "content": "A fotossíntese converte luz solar em energia.",
    "author": "Prof. Carlos Lima"
  }'
```

**Listar todos**

```bash
curl http://localhost:3000/posts
```

**Buscar por palavra-chave**

```bash
curl "http://localhost:3000/posts/search?q=fotossíntese"
```

**Ler um post**

```bash
curl http://localhost:3000/posts/<ID>
```

**Editar um post**

```bash
curl -X PUT http://localhost:3000/posts/<ID> \
  -H "Content-Type: application/json" \
  -d '{ "title": "Novo título" }'
```

**Excluir um post**

```bash
curl -X DELETE http://localhost:3000/posts/<ID>
```

### Respostas de erro

Formato padronizado pelo middleware central:

```json
{
  "error": "ValidationError",
  "message": "Dados inválidos",
  "details": { "title": ["title não pode ser vazio"] }
}
```

| Status | Quando                                       |
| ------ | -------------------------------------------- |
| `400`  | Corpo/query inválidos (validação Zod)        |
| `404`  | Post não encontrado / rota inexistente       |
| `500`  | Erro interno inesperado                      |

---

## 📖 Documentação interativa (Swagger)

Com a API rodando, acesse:

**http://localhost:3000/docs**

Interface Swagger UI para explorar e testar todos os endpoints.

---

## 🧪 Testes

O projeto usa **Jest** (unitários) + **Supertest** (integração). A cobertura
mínima exigida (20%) é garantida por `coverageThreshold` no
[`jest.config.js`](jest.config.js).

```bash
# Apenas testes unitários (não precisam de banco)
npm run test:unit

# Todos os testes (unit + e2e — requer banco no ar)
npm test

# Com relatório de cobertura
npm run test:cov
```

> Os testes **e2e** exigem um PostgreSQL com as migrations aplicadas.
> Suba o banco antes com `docker compose up -d db` e rode
> `npm run prisma:deploy`.

- **Unitários** (`tests/posts.service.test.ts`): testam o `PostsService` com um
  repositório mockado — cobrem as funções críticas (criação, edição, exclusão e
  busca), sem tocar no banco.
- **Integração** (`tests/posts.e2e.test.ts`): sobem a app Express e batem em
  todos os endpoints contra um banco real.

---

## ⚙️ CI/CD

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda a cada
push/PR na branch `main`:

1. Instala dependências (`npm ci`)
2. Gera o Prisma Client
3. Lint (ESLint)
4. Aplica migrations em um PostgreSQL de serviço
5. Executa os testes com cobertura
6. Compila o TypeScript
7. Faz o build da imagem Docker (valida o `Dockerfile`)

---

## 📓 Relato de experiências e desafios

Consulte [`docs/RELATO.md`](docs/RELATO.md).
