# Fase 4 — Entrega, aceite e demonstração

- Código: [GitHub — tech-challenge-blog](https://github.com/DevTeixeira25/tech-challenge-blog).
- Aplicativo: [mobile/](../mobile/); API: [src/](../src/); banco e migrações: [prisma/](../prisma/).
- Configuração, arquitetura e uso: [FASE4_ARQUITETURA.md](FASE4_ARQUITETURA.md) e [README raiz](../README.md).
- Decisões e relato: [FASE4_RELATO.md](FASE4_RELATO.md).
- Vídeo: [demonstração legendada](media/demonstracao-fase4.webm), **4min54s**, sem áudio, renderizador React Native Web.
- Código da Fase 4: [branch codex/fase4-mobile-20261118](https://github.com/DevTeixeira25/tech-challenge-blog/tree/codex/fase4-mobile-20261118), publicada para revisão antes de integrar à main.

As caixas abaixo registram o aceite local. A descrição de uma implementação não equivale a aprovação do critério. Marque somente após verificar o comportamento e registrar a evidência real.

## Requisitos obrigatórios

| Aceite | Requisito e campos | Onde verificar / resultado esperado |
| --- | --- | --- |
| [x] | React Native com componentes funcionais e hooks | `mobile/`, telas em `src/app/`, hooks/contexto; navegação via Expo Router. |
| [x] | Lista de posts: título, autor e breve descrição | Home `/`; conferir `title`, `author` e resumo do `content` em cada item. |
| [x] | Busca de posts | Buscar um termo, conferir resultados e estado sem resultados; integração `GET /posts/search?q=...`. |
| [x] | Leitura completa | Abrir `/posts/[id]`; conferir título, autor e conteúdo completo de `GET /posts/:id`. |
| [x] | Criar post: título, conteúdo e autor | Professor autenticado, criação em `/admin/posts/new`; persistência via `POST /posts`. |
| [x] | Editar postagem com dados atuais carregados | `/admin/posts/[id]`; conferir título, conteúdo e autor antes da alteração; salvar com `PUT /posts/:id` e reler. |
| [x] | Editar dados atuais do docente | Abrir um registro existente em Professores; conferir nome/e-mail carregados; alterar e consultar novamente. Não exibir senha atual. |
| [x] | Administração de posts com editar e excluir | `/admin/posts`; conferir ações, alteração persistida e exclusão via `DELETE /posts/:id`. |
| [x] | Listagem paginada de professores com editar/excluir | `/admin/people/teachers`; conferir páginas e metadados de `GET /teachers?page=...&pageSize=...`. |
| [x] | Cadastro de professores por professores | `/admin/people/teachers/new`; nome, e-mail e senha; `POST /teachers` exige docente autenticado. |
| [x] | Consulta, edição e exclusão de professores | `GET`, `PUT`, `DELETE /teachers/:id`; edição pré-carregada e senha opcional. Não usar a própria conta na exclusão; autoexclusão deve retornar 409. |
| [x] | Listagem paginada de alunos com editar/excluir | `/admin/people/students`; conferir páginas e metadados de `GET /students?page=...&pageSize=...`. |
| [x] | Cadastro, consulta, edição e exclusão de alunos | `/admin/people/students/new` e registro existente; nome, e-mail e senha na criação; GET/POST/PUT/DELETE reais. |
| [x] | Login docente | `/login`, campos e-mail/senha; `POST /auth/login`, token e `role=TEACHER`; sessão conferida com `/auth/me`. |
| [x] | Criação, edição e administração somente para autenticados autorizados | Tentar acesso sem sessão pela interface e sem token pela API; escrita sem token deve retornar 401. |
| [x] | Professores criam/modificam; estudantes somente visualizam | Entrar como estudante; ler/buscar; tentar escrita na API com token STUDENT e conferir 403. |
| [x] | Cadastro público não promove para professor | `POST /auth/register` sem convite cria STUDENT; professor nasce da gestão autorizada ou convite válido. |
| [x] | Sessão de usuário removido perde acesso | Em ambiente de teste, excluir uma conta por outro professor e tentar usar seu token antigo; API retorna 401. |
| [x] | Integração REST com backend Node existente | Conferir operações reais de posts, `/teachers`, `/students` e `/auth`; alterações persistem no PostgreSQL após nova consulta. |
| [x] | README com configuração, arquitetura e uso | Seguir o README raiz e o guia Fase 4 em instalação limpa; conferir URLs por dispositivo. |
| [x] | Código disponibilizado no GitHub | Verificar que o avaliador acessa o commit/branch que contém API, mobile e docs da Fase 4. |
| [x] | Documento com arquitetura, uso e experiências/desafios reais | Conferir guia técnico e o relato de Jefferson com os desafios observados. |
| [x] | Vídeo até 15 minutos | Gravar, conferir duração e acessibilidade do link; mostrar funcionalidades e decisões técnicas. |

### Validação dos campos

- [x] Posts: título de 1 a 200 caracteres, conteúdo não vazio e autor de 1 a 120; criação com os três campos; edição carregando os valores atuais e enviando ao menos um campo.
- [x] Professores/alunos: nome de 3 a 120 caracteres e e-mail válido; senha obrigatória com pelo menos 8 caracteres e no máximo 72 bytes UTF-8 na criação; senha opcional na edição, com os mesmos limites quando informada.
- [x] Edição de pessoas não busca nem exibe senha/hash. Deixar nova senha em branco conserva a anterior.
- [x] E-mail duplicado gera conflito; erros de validação são exibidos sem indicar sucesso.
- [x] Perfil definido pelo recurso e protegido na API; `role` enviado na gestão de pessoas é rejeitado.
- [x] Paginação de pessoas: `page` padrão 1, `pageSize` padrão 10, máximo 100; resposta com `items`, `page`, `pageSize`, `total`, `totalPages`; navegação coerente com os limites.

## Opcional

- [ ] Comentários em posts, se implementados. Não são necessários para aprovar os requisitos obrigatórios; registrar o estado real antes da entrega.

## Roteiro completo alternativo — 14 minutos e 30 segundos

O screencast real legendado do aplicativo em React Native Web está disponível em [media/demonstracao-fase4.webm](media/demonstracao-fase4.webm), com 4min54s e sem áudio. Esse vídeo não é evidência de execução nativa. O roteiro abaixo é uma alternativa para gravar a apresentação completa com os detalhes técnicos exigidos.

Prepare o banco de demonstração com as migrações e o seed atualizados. Mantenha registros suficientes para mais de uma página de professores e alunos. Use contas descartáveis nas exclusões. Abra aplicativo, código e documentos antes da gravação.

| Tempo | Demonstração e evidência |
| --- | --- |
| 0:00–0:45 | Apresentar objetivo, React Native/Expo, API Node e PostgreSQL; apontar o repositório. |
| 0:45–2:15 | Como visitante: lista com título/autor/resumo, busca e leitura completa. |
| 2:15–3:15 | Mostrar restrição administrativa sem sessão e login docente. |
| 3:15–5:30 | Criar post preenchendo título/conteúdo/autor; reler; editar com dados atuais; excluir na administração. |
| 5:30–7:45 | Professores: paginação, cadastro por docente, edição pré-carregada e exclusão de conta descartável. Mostrar a edição do próprio cadastro e a proteção contra autoexclusão. |
| 7:45–10:00 | Alunos: paginação e CRUD com nome/e-mail/senha; edição com senha opcional. |
| 10:00–11:15 | Entrar como estudante, consultar posts e mostrar restrições. Evidenciar na API recusa sem token e com token STUDENT. |
| 11:15–12:30 | Mostrar componentes funcionais/hooks, rotas Expo Router, serviço HTTP, armazenamento de sessão e autorização no backend. |
| 12:30–13:15 | Mostrar README, configuração de URL por dispositivo e arquitetura mobile/API/banco. |
| 13:15–14:30 | Apresentar o documento de experiências com fatos reais informados pelo autor/equipe; indicar GitHub, documentos e entregas. |

A margem final é de 30 segundos para transições. Se comentários estiverem implementados, encurte outra etapa para mostrá-los sem exceder 15 minutos. Não apresente uma etapa como validada se ela não foi executada.

## Evidências confirmadas em 18/11/2026

Resultados comunicados durante esta implementação assistida. As caixas de aceite acima continuam sendo o controle da demonstração completa; aprovação de uma ferramenta não marca automaticamente todos os requisitos de interface.

| Verificação | Ambiente | Resultado e limites |
| --- | --- | --- |
| API: migrações e seed | PostgreSQL 16 local isolado | Migrações aplicadas; seed executado duas vezes, sem duplicação: 14 professores, 13 alunos e 3 posts. Login real de professor e estudante confirmado. |
| API: lint e build | Desenvolvimento local | Aprovados. |
| API: testes | Banco PostgreSQL exclusivo de teste | 81 testes em 7 suítes aprovados, incluindo concorrência de convites/exclusão e limite de senha multibyte. Não reutilizar a cobertura percentual histórica da Fase 3. |
| Proteção dos testes | `jest.safety.js` e CI | Integração bloqueada quando o nome do banco da `DATABASE_URL` não contém o segmento test; CI usa `blog_test`. |
| Mobile: typecheck e lint | Expo SDK 58 | Aprovados. |
| Mobile: exportação web | Expo SDK 58 / React Native Web | Aprovada. Não comprova execução Android/iOS. |
| Mobile: Expo Doctor | Expo SDK 58 | 20/20 verificações aprovadas. |
| Mobile: revisão estática | Código do aplicativo | Tratadas corridas de sessão/401, carregamento e confirmação via Modal; não substitui execução dos fluxos. |
| Interface no navegador | React Native Web | 17 fluxos aprovados com API e PostgreSQL reais; nenhum erro JavaScript de página. [Evidências](media/verificacao-interface.json). |
| Execução física/binário nativo | Android/iOS | Não realizados: sem teste em aparelho físico e sem geração/instalação de binário. |
| Auditoria de dependências | npm audit em 19/11/2026 | Zero alertas nas três frentes, incluindo desenvolvimento. O advisory residual de picomatch foi retirado da base oficial; [histórico](DEPENDENCIAS.md). |
| Vídeo | Arquivo WebM incluído | Gravação legendada de 4min54s disponível; conferir a forma de envio aceita pela instituição. |
| Código da fase | GitHub | Branch `codex/fase4-mobile-20261118`; revisão antes de integrar à main. |

As verificações aprovadas não representam certificação de segurança nem prontidão para produção. Avaliação das dependências, validação nativa e configuração de implantação permanecem como limitações objetivas. Consulte [FASE4_ARQUITETURA.md](FASE4_ARQUITETURA.md) para executar testes somente em banco isolado.

## Revisão antes da submissão

1. Conferir o relato do autor, que foi escrito com base em fatos do desenvolvimento assistido.
2. Conferir o acesso à branch da Fase 4 e aos arquivos de documentação e vídeo.
3. Realizar validação Android/iOS físico antes de distribuir o aplicativo; esta etapa não foi executada nesta entrega.

## Evidência integrada final - 18/11/2026

A verificação automatizada no Chrome exercitou **17 fluxos aprovados**, com o aplicativo React Native Web em viewport de celular conectado à API Express e PostgreSQL reais. Incluiu leitura pública, busca, login de aluno e docente, bloqueio de rota de aluno, CRUD de posts e dos dois perfis, paginação das duas listas, cancelamento/confirmação de exclusão, falha de rede com recuperação e rejeição HTTP 403 para escrita de estudante. Nenhum erro JavaScript de página foi registrado. Os dados usados eram exclusivos de demonstração.

Foi produzida uma gravação legendada, sem áudio, chamada `demonstracao-fase4.webm`. Ela mostra os fluxos e oito capítulos com trechos reais do código, números de linha e explicações técnicas. Consulte [os capítulos](VIDEO_FASE4.md). A gravação usa o renderizador web do React Native e não representa execução em aparelho físico. O roteiro de 14min30s deste documento continua disponível para uma apresentação narrada pela equipe.

A suíte final da API tem **81 testes aprovados em 7 suítes**. TypeScript, lint e build da API e da versão web passaram. No mobile, passaram typecheck, lint, exportação web e Expo Doctor (20/20). O projeto inclui CI para as três frentes; a execução remota do CI só poderá ser confirmada depois da publicação.
