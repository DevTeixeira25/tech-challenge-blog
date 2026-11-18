# Fase 4 — Arquitetura, configuração e uso

Esta fase acrescenta o aplicativo React Native em `mobile/` e os perfis de professor e estudante à API existente. A interface React de `web/` e os documentos sem prefixo FASE4 registram fases anteriores. Este documento descreve decisões e contratos; os resultados de execução devem ser registrados em [FASE4_ENTREGA.md](FASE4_ENTREGA.md).

## Arquitetura

```text
mobile/ — Expo 58 + React Native + TypeScript
  src/app/ (Expo Router: telas e navegação)
  componentes funcionais + hooks + contexto de autenticação
  serviços HTTP + armazenamento da sessão
                       | REST/JSON + Authorization: Bearer <token>
                       v
API Node.js + Express + TypeScript
  rotas -> controllers/validação Zod -> services -> repositories
  autenticação JWT + consulta do perfil atual no banco
                       | Prisma
                       v
PostgreSQL: posts, users, invites
```

O cliente apresenta a navegação conforme o perfil; a API aplica a autorização independentemente da interface. Professores (`TEACHER`) gerenciam posts, professores e alunos. Estudantes (`STUDENT`) somente consultam o blog. A leitura de posts também é pública.

O Expo Router mantém as telas em `mobile/src/app/`; componentes, contexto e serviços ficam fora da pasta de rotas. Componentes funcionais e hooks organizam estado, carregamento e efeitos. A interface está em português. O cliente HTTP centraliza URL base, JSON, envio do token e erros. No aplicativo nativo, o token é armazenado com Expo SecureStore; na versão web do aplicativo, fica somente em memória e uma atualização da página encerra a sessão local.

### Banco e compatibilidade

- `Post`: `id`, `title`, `content`, `author`, `createdAt`, `updatedAt`. O autor continua como texto, preservando o contrato da API anterior; não é uma relação com `User`. A descrição breve da lista é uma apresentação do conteúdo, não um novo campo obrigatório da API.
- `User`: `id`, `name`, `email` único, `passwordHash`, `role`, datas de criação e atualização. Senhas são armazenadas com hash bcrypt; o hash não deve aparecer nas respostas.
- `Role`: `TEACHER` ou `STUDENT`. A migração usa `TEACHER` para preservar as contas docentes legadas. O cadastro público define explicitamente `STUDENT` quando não há convite válido.
- `Invite`: código, e-mail opcional, validade, uso e identificação de quem convidou e utilizou. Um convite válido permite cadastrar um professor.

Não há relação de propriedade entre professor e post: a autorização é por perfil. Qualquer professor autenticado pode administrar as postagens. A exclusão de usuário não transforma o texto do autor de posts existentes.

## Configuração da API e do banco

Pré-requisitos: Node.js 20 ou superior, npm e PostgreSQL; Docker Compose é uma opção para disponibilizar o banco. Execute na raiz do repositório, em terminais separados quando necessário:

```powershell
npm install
Copy-Item .env.example .env
docker compose up -d db
npm run prisma:generate
npm run prisma:deploy
npm run seed
npm run dev
```

Se usar PostgreSQL próprio, substitua o comando Docker e ajuste `DATABASE_URL`. O arquivo `.env` usa `PORT=3000`, conexão local do banco em `localhost:5433`, `JWT_SECRET` e `JWT_EXPIRES_IN`. No Compose, a porta interna do PostgreSQL é 5432; a publicada no computador é 5433. Configure um segredo próprio na implantação.

A API atende em `http://localhost:3000`; o Swagger está em `http://localhost:3000/docs`. O Compose da raiz também contém a SPA histórica; ele não inicia o aplicativo Expo. O ambiente local usa `NODE_ENV=${NODE_ENV:-development}` por padrão; configure explicitamente o ambiente de implantação. Aplique a migração de perfis antes de usar a Fase 4.

### Contas de desenvolvimento

Depois de executar o seed atualizado da Fase 4:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Professor | `ana@blog.dev` | `senha123` |
| Estudante | `aluno@blog.dev` | `aluno1234` |

A senha docente curta é uma credencial legada de demonstração; novos cadastros e novas senhas devem ter ao menos 8 caracteres. O seed da Fase 4 também fornece registros para demonstrar paginação. Confirme a saída do seed no ambiente utilizado; estes são dados de desenvolvimento.

## Configuração do aplicativo

Em outro terminal:

```powershell
Set-Location mobile
npm install
Copy-Item .env.example .env
npm start
```

Defina `EXPO_PUBLIC_API_URL` em `mobile/.env`, conforme o dispositivo que efetivamente faz a requisição:

| Execução do aplicativo | URL da API |
| --- | --- |
| Navegador no mesmo computador | `http://localhost:3000` |
| Emulador Android padrão | `http://10.0.2.2:3000` |
| Celular físico na mesma rede | `http://<IP-LAN-DO-COMPUTADOR>:3000` |

No celular, `localhost` identifica o próprio telefone. Substitua o marcador pelo IPv4 do computador, mantenha os dois dispositivos na mesma rede e permita o acesso à porta 3000 quando o sistema solicitar. Após mudar o ambiente, reinicie o servidor Expo. A URL da API deve ser acessível pelo dispositivo, mesmo quando o servidor Expo estiver acessível por outro caminho.

Scripts em `mobile/`: `npm start`, `npm run android`, `npm run ios`, `npm run web`, `npm run typecheck`, `npm run lint` e `npm run export:web`. A abertura local do simulador iOS exige macOS e ferramentas correspondentes; no Windows, use Android, web ou dispositivo compatível. Consulte também [mobile/README.md](../mobile/README.md).

## Contratos REST da Fase 4

Todas as rotas abaixo são relativas à URL base configurada. A senha usa o campo `password`; os nomes exibidos em português não alteram o contrato JSON.

| Método e rota | Acesso e comportamento |
| --- | --- |
| `POST /auth/login` | Público; recebe `email`, `password`; devolve token e usuário com `role`. |
| `GET /auth/me` | Autenticado; devolve `id`, `name`, `email`, `role` atuais. |
| `POST /auth/register` | Sem convite: estudante; com convite válido: professor. |
| `POST /auth/invites`, `GET /auth/invites` | Professor autenticado gera/lista convites. |
| `GET /posts` | Público; lista posts. |
| `GET /posts/search?q=termo` | Público; busca por palavra-chave. |
| `GET /posts/:id` | Público; leitura completa. |
| `POST /posts` | Professor; cria com `title`, `content`, `author`. |
| `PUT /posts/:id` | Professor; altera um ou mais campos do post. |
| `DELETE /posts/:id` | Professor; exclui post. |
| `GET /teachers`, `GET /students` | Professor; listagens paginadas. |
| `POST /teachers`, `POST /students` | Professor; cria pessoa com `name`, `email`, `password`. |
| `GET /teachers/:id`, `GET /students/:id` | Professor; carrega os dados atuais para edição. |
| `PUT /teachers/:id`, `PUT /students/:id` | Professor; atualiza campos informados. |
| `DELETE /teachers/:id`, `DELETE /students/:id` | Professor; exclui pessoa; autoexclusão docente retorna 409. |

### Campos e paginação

- Post: título obrigatório, de 1 a 200 caracteres; conteúdo obrigatório e não vazio; autor obrigatório, de 1 a 120 caracteres. A edição exige ao menos um campo. O formulário deve carregar título, conteúdo e autor atuais antes de editar.
- Professor/aluno: criação com nome de 3 a 120 caracteres, e-mail válido e senha com pelo menos 8 caracteres e no máximo 72 bytes em UTF-8. Na edição, nome e e-mail são carregados do registro; a senha é opcional e nunca é recuperada do servidor. Se uma nova senha for enviada, o limite continua sendo de pelo menos 8 caracteres e no máximo 72 bytes em UTF-8. Caracteres acentuados e emojis podem ocupar vários bytes; o limite não equivale a 72 caracteres. O login mantém compatibilidade com senhas legadas a partir de 6 caracteres. A atualização exige ao menos um campo.
- O perfil é determinado pelo recurso `/teachers` ou `/students`. Enviar `role` no corpo da gestão de pessoas é rejeitado com 400.
- Listagens de pessoas recebem `page` (inteiro de 1 a 1.000.000, padrão 1) e `pageSize` (inteiro de 1 a 100, padrão 10), por exemplo `GET /students?page=2&pageSize=10`.
- A resposta tem a forma `{ "items": [], "page": 1, "pageSize": 10, "total": 0, "totalPages": 0 }`; os valores reais variam com o banco. A interface usa os metadados para controlar anterior/próxima e informar a página.

### Autenticação e autorização

O login valida a senha e devolve JWT. Requisições protegidas enviam `Authorization: Bearer <token>`. A API consulta o usuário no banco para aplicar o perfil atual, em vez de depender apenas de dados antigos do token. Token inválido, expirado ou pertencente a usuário excluído resulta em 401; estudante tentando gerenciar conteúdo ou pessoas recebe 403. A autoexclusão do professor é bloqueada com 409, e e-mail duplicado também é conflito.

Cadastro aberto não concede acesso docente. Um professor pode cadastrar outro diretamente em Professores; o fluxo por convite permanece uma alternativa na API. Não se deve enviar `role=TEACHER` pelo cadastro público para obter privilégios.

## Guia de uso

1. Abra o aplicativo sem sessão: consulte a lista, pesquise e abra o conteúdo completo de um post.
2. Entre como professor na tela de login. A área administrativa permite acessar Posts, Professores e Alunos.
3. Em Posts, crie uma publicação com título, conteúdo e autor. Abra a edição para conferir os valores atuais, altere, salve e confira a leitura. Use Excluir para remover um registro de demonstração.
4. Em Professores ou Alunos, navegue entre páginas. Cadastre nome, e-mail e senha; use Editar para carregar os dados atuais e atualizar. Para conservar a senha, deixe o campo de nova senha vazio. Use Excluir em uma conta de demonstração diferente da própria.
5. Para editar o docente atual, abra seu registro em Professores; nome/e-mail atuais devem estar preenchidos. A própria exclusão é bloqueada.
6. Saia e entre como estudante. Confirme leitura e busca, e a indisponibilidade de ações administrativas. A API deve recusar a escrita mesmo quando tentada fora da interface.

Rotas do aplicativo: `/`, `/posts/[id]`, `/login`, `/admin`, `/admin/posts`, `/admin/posts/[id]`, `/admin/people/[kind]` e `/admin/people/[kind]/[id]`. Na gestão, `kind` é `teachers` ou `students`; o identificador `new` abre criação.

## Verificação e banco isolado

A suíte de integração apaga dados. Use um banco exclusivo, vazio ou descartável, com `test` como segmento do nome, por exemplo `blog_fase4_test`. A proteção em `jest.safety.js` bloqueia a integração se a URL não apontar para um banco com esse padrão; não a desative para usar o banco de desenvolvimento. O CI está configurado com o banco `blog_test`.

Depois de criar o banco isolado no seu PostgreSQL, execute na raiz, ajustando usuário, senha e porta ao ambiente de testes:

```powershell
$env:DATABASE_URL = 'postgresql://blog:blog@localhost:5433/blog_fase4_test?schema=public'
npm run prisma:generate
npm run prisma:deploy
npm run lint
npm run build
npm run test:cov
Remove-Item Env:DATABASE_URL
```

A última linha remove a configuração temporária do terminal; os processos seguintes podem voltar a carregar o `.env`. Não execute o seed da demonstração no lugar da preparação do banco de teste.

Em `mobile/`: `npm run typecheck`, `npm run lint`, `npm run export:web` e `npx expo-doctor`. Os resultados confirmados em 18/11/2026 incluem API com 77 testes em 6 suítes, build/lint; mobile com typecheck/lint/export web e Expo Doctor 20/20. Consulte a tabela de evidências em [FASE4_ENTREGA.md](FASE4_ENTREGA.md) para distinguir esses resultados do fluxo visual completo ainda em registro.

## Limitações observadas

- As verificações móveis foram realizadas no contexto de desenvolvimento/exportação e de um teste inicial no navegador com React Native Web. Não houve validação em dispositivo físico Android/iOS nem geração e instalação de binário nativo. A exportação web não comprova execução nativa.
- A revisão estática tratou corridas de sessão/401, atualização de carregamento e confirmação via Modal. Essa revisão não substitui a validação completa dos fluxos pela interface.
- A auditoria de dependências, após atualizações compatíveis, ainda reportou 46 ocorrências na raiz (44 altas, 2 moderadas) e 42 no mobile (40 altas, 2 moderadas), incluindo dependências herdadas/de desenvolvimento. Entre os apontamentos da raiz estão Zod 3 e qs. Não foi aplicado ajuste forçado que pudesse romper compatibilidade do Expo ou backend. As contagens representam o resultado daquele ambiente/data e podem mudar com novas bases de auditoria.
- Testes aprovados e verificação de compatibilidade não certificam segurança para produção. Permanecem pendentes a avaliação das dependências vulneráveis, a validação nativa e a configuração de implantação.
