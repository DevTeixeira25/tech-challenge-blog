# Fase 4 - Relato de desenvolvimento

**Autor:** Jefferson de Oliveira da Costa Teixeira.

## Contexto e abordagem

Nesta fase, parti da aplicação de blog que já tinha back-end Node.js, PostgreSQL e interface web. O desafio foi acrescentar um aplicativo React Native que reutilizasse essa base e atendesse também à administração de professores e alunos. Utilizei assistência de IA com subagentes para separar planejamento, implementação e revisão, mantendo os resultados de testes como evidência do que foi validado.

## Integração com o projeto anterior

Ao analisar o projeto, identifiquei que os endpoints de posts e autenticação já existiam, mas faltavam a gestão paginada de pessoas e a separação entre os perfis. Precisei ampliar a API sem perder as contas anteriores nem alterar o contrato dos posts. A migração adotada manteve os usuários antigos como professores e acrescentou o papel de estudante. Também adequei a interface web para que ela respeitasse os novos perfis.

Outro cuidado foi o endereço da API. No navegador, o aplicativo consegue acessar o servidor local; em um emulador ou celular físico, o endereço muda. Documentei essas diferenças para evitar tratar localhost como se apontasse sempre para a máquina de desenvolvimento. A validação executada nesta entrega utilizou React Native Web no Chrome e API real local.

## Autorização além da interface

Um dos principais desafios foi garantir que o aluno realmente tivesse acesso apenas à leitura. Esconder botões não bastava. A solução passou a consultar a conta e seu perfil no banco em cada operação protegida. Com isso, um usuário excluído perde acesso mesmo que ainda possua um token. O cadastro público sem convite passou a criar estudante, enquanto novos professores dependem da gestão autorizada ou de convite válido.

A revisão também encontrou riscos de concorrência. Um convite precisava ser consumido uma única vez, mesmo com duas solicitações simultâneas. Além disso, duas exclusões concorrentes não poderiam deixar a escola sem professor. Esses casos foram tratados com transações e verificação do ator dentro da operação, acompanhadas de testes específicos.

## Estado do aplicativo e experiência de uso

Na integração das telas, precisei considerar respostas que chegam depois de uma troca de sessão ou de rota. Sem esse cuidado, um erro de uma sessão antiga poderia derrubar uma nova, ou um editor poderia receber dados de outro cadastro. A implementação passou a conferir o token da solicitação, a sequência do carregamento e a identidade da rota.

Também ajustei a confirmação de exclusão para um modal central: em uma lista longa, uma confirmação no cabeçalho poderia ficar fora da área visível. Os estados de carregamento, erro, lista vazia e recuperação de conexão foram tratados para não apresentar uma operação incompleta como sucesso.

## Senhas e compatibilidade

O limite do bcrypt trouxe uma diferença importante entre caracteres e bytes. Senhas com acentos e emojis podem ocupar mais de um byte por caractere. Alinhei a validação de senhas novas ao máximo de 72 bytes UTF-8, preservando o login de contas legadas. Foram acrescentados testes com entradas multibyte.

Na auditoria das dependências, apliquei atualizações compatíveis na raiz, mas permaneceram alertas que exigem avaliação e possíveis mudanças de versões principais. Evitei uma atualização forçada que pudesse quebrar o conjunto suportado pelo Expo. Esses alertas estão documentados como limitação, e não como problema resolvido.

## Revisão das dependências e do vídeo

Na revisão seguinte, migrei a validação para Zod 4 e atualizei Express e qs, preservando os contratos dos formulários. Acrescentei quatro testes de compatibilidade aos 77 existentes. Também atualizei a versão web e corrigi minimatch apenas no componente do Expo que precisava da alteração. A auditoria das dependências de produção da API e da web passou a não reportar vulnerabilidades.

Não tratei o número de alertas como sinônimo de falhas independentes: os avisos restantes são efeitos transitivos de uma única vulnerabilidade de picomatch, ainda sem versão corrigida em 18/11/2026. Mantive esse resultado documentado.

Para reforçar os detalhes técnicos pedidos no enunciado, complementei o vídeo com trechos reais da navegação, hooks, cliente HTTP, sessão, middleware de autorização, rotas de pessoas, validação e testes. Também confirmei no Safari do iPhone que o aparelho alcança a API; o aplicativo nativo ainda precisa ser aberto pelo Expo Go.

## Verificação e aprendizados

Utilizei bancos separados para os testes que limpam tabelas e para a demonstração. Também acrescentei uma proteção que recusa testes de integração quando o banco não tem o segmento test no nome. A repetição do seed confirmou que ele não duplica os dados de demonstração nem substitui credenciais existentes.

A API terminou com **81 testes aprovados em 7 suítes**. No aplicativo, foram aprovados typecheck, lint, exportação web e as 20 verificações do Expo Doctor. A execução integrada no Chrome exercitou **17 fluxos** com API e PostgreSQL reais, incluindo CRUD, paginação, bloqueio de aluno e recuperação de falha de rede. A demonstração legendada, agora com o código, tem **4min54s**, sem áudio.

O principal aprendizado foi verificar cada fronteira: tela, requisição, autorização, persistência e resposta. Compilar a aplicação não confirma sozinho que o fluxo funciona. Também mantive explícito o limite desta entrega: não executei o app em aparelho físico Android/iOS nem gerei binários assinados. Essa validação permanece necessária antes de distribuir o aplicativo.

## Materiais relacionados

- [Arquitetura, configuração e uso](FASE4_ARQUITETURA.md).
- [Aceite e demonstração](FASE4_ENTREGA.md).
- [Demonstração gravada](media/demonstracao-fase4.webm).
- [Evidências da interface](media/verificacao-interface.json).

Este relato foi redigido em primeira pessoa a pedido do autor, a partir dos fatos observados no desenvolvimento assistido. Não atribui experiências das fases anteriores a esta fase.

## Conferência de 19/11/2026

Na conferência seguinte, as auditorias completas da API, do mobile e da web retornaram zero alertas. O advisory de picomatch foi retirado da base oficial. Registrei essa mudança separadamente das atualizações de código, pois a retirada do aviso não é uma nova versão corrigida do pacote.
