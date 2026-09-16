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

## Fase 3 — a interface em React

Com a API pronta, faltava a parte que as pessoas realmente veem. Escolhi Vite
com React e TypeScript, styled-components para a estilização e a Context API
para o estado de autenticação. Redux resolveria o mesmo problema, mas seria
peso demais: o único estado global aqui é "quem está logado".

### O requisito que faltava no back-end

O enunciado pede login de professores, e o back-end da fase anterior não tinha
nenhuma autenticação — qualquer pessoa com o endereço da API podia apagar um
post. Então, antes de escrever a primeira tela, voltei ao Node: criei o model
`User`, o login com bcrypt e JWT, e o middleware que fecha `POST`, `PUT` e
`DELETE`. Isso mudou os testes e2e, que passaram a fazer login antes de escrever,
e ganhei de brinde testes novos garantindo o 401 nas rotas protegidas.

Foi bom ter feito nessa ordem: se eu tivesse "resolvido" o login só no
front-end, a tela ficaria bonita e a API continuaria aberta. A regra de
segurança de verdade tem que estar no servidor; o front apenas esconde o que a
pessoa não pode usar.

### Quem entrega a senha do primeiro professor?

Resolvido o login, sobrou uma pergunta que o enunciado não responde: como um(a)
docente que nunca acessou consegue entrar? Cadastro aberto estava fora de
questão — seria abrir a porta que eu tinha acabado de trancar, já que qualquer
pessoa poderia se cadastrar e publicar no blog da escola.

Fui de convite: quem já tem acesso gera um código de uso único, com validade, e
manda o link para o(a) colega. É o mesmo desenho de várias ferramentas
corporativas, e mantém a coordenação no controle de quem entra sem precisar de
um painel de administrador. O código usa um alfabeto sem `0/O` e `1/I/L`, para
poder ser ditado no telefone sem confusão.

Também considerei vincular os docentes a uma instituição e desisti: uma
instituição só faz sentido se a aplicação atender várias escolas, e aí não é um
campo a mais, é multi-tenancy — filtro em toda consulta, autorização por escola,
listagem pública sabendo qual blog exibir. Um campo `instituicao` solto, sem
nada filtrando por ele, seria pior que não ter: dá aparência de regra sem regra
nenhuma. Ficou registrado como evolução futura.

### Buscar dados sem cair em corrida

A busca da home dispara a cada tecla, e aí moram dois problemas clássicos: uma
chamada por caractere digitado e respostas antigas chegando depois das novas e
sobrescrevendo a lista. Já entrei prevenido nos dois: _debounce_ de 400 ms antes
de chamar a API e um `AbortController` por requisição, de modo que trocar o termo
cancela a busca anterior.

O ESLint me empurrou para uma solução melhor do que eu tinha. A regra
`react-hooks/set-state-in-effect` reprovou o padrão que eu sempre usei —
`setLoading(true)` no começo do `useEffect` — porque ele provoca renders em
cascata. Em vez de desligar a regra, extraí o hook `useAsyncResource`, em que o
`loading` é **derivado** (comparo a chave dos dados guardados com a chave atual)
e o `setState` só acontece dentro do `.then`/`.catch`. As quatro páginas que
buscam dados ficaram menores e o comportamento, mais previsível.

### Dois detalhes de Docker que a fase anterior me ensinou a olhar antes

Depois do episódio do Prisma no Alpine, fui para a containerização da SPA já
desconfiado, e dois pontos pediam atenção.

O primeiro é o fallback do nginx. Abrir `/admin` direto pela URL devolveria 404,
porque essa rota existe no React Router, dentro do navegador, e o servidor não
sabe dela. Daí o `try_files $uri $uri/ /index.html` na configuração.

O segundo é a URL da API. O caminho intuitivo seria usar `http://app:3000`, o
nome do serviço no compose, mas quem faz a chamada é o navegador da pessoa, que
não enxerga a rede interna do Docker: tem que ser o endereço do host
(`http://localhost:3000`). E, como o bundle é estático, essa URL entra em tempo
de **build**, por build arg — passar por `environment` no compose não teria
efeito nenhum.

### O que levo desta fase

Repetir no front-end a mesma disciplina de camadas do back-end (páginas → hooks
→ services) deixou o código fácil de seguir, e concentrar o `fetch` num lugar só
fez o tratamento de erro e o envio do token ficarem consistentes de graça.
Acessibilidade e responsividade também são mais baratas quando pensadas desde o
começo: rótulo em todo campo, foco visível, um tema com breakpoints e alvos de
toque de 44px custaram pouco e mudam muito a experiência de quem usa o blog no
celular.

## Divisão de tarefas

Como o projeto foi individual, fiz todas as etapas: arquitetura, a API em
Express/TypeScript, o banco com Prisma e PostgreSQL, a autenticação com JWT, a
interface em React, a configuração de Docker e CI/CD, os testes e a
documentação.
