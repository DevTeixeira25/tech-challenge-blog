# Relato de experiências e desafios

Fiz este projeto sozinho, então o relato abaixo é a minha experiência com o
desenvolvimento do começo ao fim.

## Contexto

A aplicação começou na fase anterior em OutSystems, uma plataforma low-code.
Agora a ideia era refatorar o back-end para Node.js e passar a guardar os dados
num banco de verdade. Na prática, isso me obrigou a pensar na arquitetura de
forma bem mais explícita: no low-code boa parte das camadas vinha pronta, e aqui
eu tive que montar cada uma delas na mão.

## Por que escolhi cada coisa

Fui de PostgreSQL com Prisma. O Postgres por ser relacional e me dar garantia de
integridade dos dados, e o Prisma porque a experiência de desenvolvimento é
muito boa: tipagem, migrations versionadas e o client gerado automaticamente
economizam bastante tempo. Escolhi TypeScript pelo mesmo motivo: com tipagem
estática eu erro menos e o código fica mais fácil de manter. E separei a
aplicação em camadas (controller, service e repository) principalmente para
conseguir testar a regra de negócio isolada, sem depender do banco.

## Os desafios que apareceram

O primeiro foi bobo, mas me travou por um tempo: o `GET /posts/search` estava
caindo no `GET /posts/:id`, porque o Express interpretava "search" como se fosse
um id. Bastou declarar a rota `/search` antes da `/:id` para resolver.

Depois quis padronizar os erros. Em vez de tratar cada caso no controller,
centralizei tudo num middleware que converte os erros de validação do Zod, os
erros de domínio (como o meu `NotFoundError`) e os erros do Prisma (o `P2025`,
de registro inexistente) em respostas HTTP consistentes.

Para os testes, separei o `app.ts` do `server.ts`. Assim os testes de integração
conseguem subir a aplicação sem abrir uma porta de rede, e como o service recebe
o repositório por injeção, os testes unitários rodam sem banco nenhum.

O desafio mais interessante foi o Prisma dentro do Alpine. Quando subi o
`docker compose`, a API entrava em loop de restart com o erro
`Could not parse schema engine response`. O que me confundiu foi que o build da
imagem passava no CI, ou seja, o pipeline estava verde, mas o container quebrava
na hora de rodar. Descobri que a imagem `node:20-alpine` usa musl e não vinha com
o OpenSSL, e sem ele o Prisma não carrega o query engine. Resolvi instalando
`openssl` e `libc6-compat` na imagem e declarando o binary target
`linux-musl-openssl-3.0.x` no `schema.prisma`. A lição que ficou foi clara: build
verde não é a mesma coisa que aplicação rodando.

Ainda na parte de ambiente, tive um problema que só acontecia na minha máquina.
Os testes e2e falhavam localmente com `Authentication failed against database
server at localhost`, mas passavam no CI. Demorei a perceber que era conflito de
porta: eu já tinha um PostgreSQL instalado ocupando a 5432, então minhas conexões
locais iam para o servidor errado, com outras credenciais. No CI isso não
acontecia porque lá o único Postgres era o do pipeline. Passei a expor o banco do
compose na porta 5433 do host (mantendo a 5432 dentro do container) e apontei o
`DATABASE_URL` local para `localhost:5433`. Também configurei o Jest para carregar
o `.env` sozinho. Foi um bom lembrete de que muita diferença entre local e CI é de
infraestrutura (portas, credenciais, rede), e não do código.

## O que levo de aprendizado

Separar a aplicação em camadas custa um pouco no início, mas paga rápido na hora
de testar e evoluir. As migrations versionadas foram essenciais para o schema não
divergir entre os ambientes. E os dois problemas de Docker me marcaram pela mesma
razão: só confiar no CI verde não basta, precisei rodar a aplicação de verdade
para achar os bugs. Por fim, ter caprichado no README e no Swagger fez diferença
até para mim mesmo durante o desenvolvimento.

## Divisão de tarefas

Como o projeto foi individual, fiz todas as etapas: arquitetura, a API em
Express/TypeScript, o banco com Prisma e PostgreSQL, a configuração de Docker e
CI/CD, os testes e a documentação.
